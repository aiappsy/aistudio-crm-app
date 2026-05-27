import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { useAuth } from './AuthContext';

export function useFirestoreCollection<T>(collectionName: string) {
  const [data, setData] = useState<(T & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !collectionName) {
      setData([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, collectionName),
      where('ownerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          ...(doc.data() as T),
          id: doc.id
        }));
        setData(docs);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        try { handleFirestoreError(error, OperationType.LIST, collectionName); } catch(e) { console.error(e) }
      }
    );

    return unsubscribe;
  }, [collectionName, user]);

  const add = async (newData: Omit<T, 'id' | 'ownerId' | 'createdAt'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, collectionName), {
        ...newData,
        ownerId: user.uid,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, collectionName);
    }
  };

  const update = async (id: string, updatedData: Partial<T>) => {
    try {
      await updateDoc(doc(db, collectionName, id), updatedData as any);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${id}`);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
    }
  };

  return { data, loading, add, update, remove };
}

export function useFirestoreDoc<T>(collectionName: string, docId: string | undefined) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !docId) {
      setData(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, collectionName, docId), 
      (snapshot) => {
        if (snapshot.exists()) {
          setData(snapshot.data() as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        try { handleFirestoreError(error, OperationType.GET, `${collectionName}/${docId}`); } catch(e) { console.error(e) }
      }
    );

    return unsubscribe;
  }, [collectionName, docId, user]);

  const set = async (newData: T) => {
    if (!user || !docId) return;
    try {
      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, collectionName, docId), {
        ...newData,
        ownerId: user.uid,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${docId}`);
    }
  };

  return { data, loading, set };
}

export function useFirestoreQuery<T>(collectionName: string, queryConstraints: any[]) {
  const [data, setData] = useState<(T & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !collectionName) {
      setData([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, collectionName), ...queryConstraints);

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          ...(doc.data() as T),
          id: doc.id
        }));
        setData(docs);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        try { handleFirestoreError(error, OperationType.LIST, collectionName); } catch(e) { console.error(e) }
      }
    );

    return unsubscribe;
  }, [collectionName, JSON.stringify(queryConstraints), user]);

  return { data, loading };
}
