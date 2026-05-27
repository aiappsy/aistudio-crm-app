const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

exports.onContactCreated = functions.firestore
  .document("contacts/{contactId}")
  .onCreate(async (snap, context) => {
    const contactData = snap.data();
    const ownerId = contactData.ownerId;

    if (!ownerId) {
      console.log("No ownerId found on contact");
      return null;
    }

    // Query active workflows for this owner where trigger is 'contact_created'
    const workflowsSnapshot = await admin
      .firestore()
      .collection("workflows")
      .where("ownerId", "==", ownerId)
      .where("trigger", "==", "contact_created")
      .where("status", "==", "active") // assuming they are active
      .get();

    if (workflowsSnapshot.empty) {
      console.log("No active workflows for this trigger");
      return null;
    }

    // Fetch user settings to get SMTP config for emailing
    const settingsDoc = await admin.firestore().collection("settings").doc(ownerId).get();
    const settings = settingsDoc.data() || {};
    const hasSmtp = settings.smtpHost && settings.smtpUser && settings.smtpPass;

    let transporter;
    if (hasSmtp) {
      transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: parseInt(settings.smtpPort) || 587,
        secure: parseInt(settings.smtpPort) === 465,
        auth: {
          user: settings.smtpUser,
          pass: settings.smtpPass,
        },
      });
    }

    const promises = [];

    workflowsSnapshot.forEach((doc) => {
      const workflow = doc.data();

      // Action: send_welcome_email
      if (workflow.action === "send_welcome_email") {
        if (contactData.email && transporter) {
          const mailOptions = {
            from: settings.smtpUser,
            to: contactData.email,
            subject: "Welcome!",
            text: `Hi ${contactData.name || "there"},\n\nWelcome to our platform. We're excited to have you on board!\n\nBest regards.`,
          };
          promises.push(
            transporter
              .sendMail(mailOptions)
              .then(() => console.log(`Welcome email sent to ${contactData.email}`))
              .catch((err) => console.error("Error sending user email", err))
          );
        } else {
          console.log("Skipping email: No contact email or SMTP not configured.");
        }
      }

      // Action: notify_owner
      if (workflow.action === "notify_owner") {
        promises.push(
          admin.firestore().collection("agentNotifications").add({
            ownerId: ownerId,
            title: "New Contact Workflow Executed",
            message: `A new contact (${contactData.name || "Unknown"}) was created.`,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            read: false,
          })
        );
      }
    });

    return Promise.all(promises);
  });
