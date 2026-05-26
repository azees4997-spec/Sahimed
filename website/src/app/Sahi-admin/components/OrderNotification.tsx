"use client"

import { useEffect, useRef, useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Bell, ShoppingBag } from 'lucide-react';

// Using a clean, professional notification sound
const ORDER_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

export function OrderNotification() {
  const db = useFirestore();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const lastOrderTime = useRef<Timestamp>(Timestamp.now());

  useEffect(() => {
    // Preload sound
    audioRef.current = new Audio(ORDER_SOUND_URL);
    
    // Most browsers block autoplay sound until user interacts with the page
    const handleFirstInteraction = () => {
      setIsReady(true);
      window.removeEventListener('click', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);

    return () => window.removeEventListener('click', handleFirstInteraction);
  }, []);

  useEffect(() => {
    if (!db) return;

    // Listen for new orders added after the current time
    const q = query(
      collection(db, 'orders'),
      orderBy('orderDate', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const order = change.doc.data();
          const orderDate = order.orderDate;

          // Convert orderDate to Firestore Timestamp if it's not already
          let orderTimestamp: Timestamp;
          if (orderDate instanceof Timestamp) {
            orderTimestamp = orderDate;
          } else if (orderDate && orderDate.seconds) {
            orderTimestamp = new Timestamp(orderDate.seconds, orderDate.nanoseconds);
          } else if (typeof orderDate === 'string' || orderDate instanceof Date) {
            orderTimestamp = Timestamp.fromDate(new Date(orderDate));
          } else {
            return; // Skip if date is missing
          }

          // Check if this is a NEW order (not one that was just loaded)
          if (orderTimestamp.toMillis() > lastOrderTime.current.toMillis()) {
            lastOrderTime.current = orderTimestamp;
            
            // Play sound
            if (audioRef.current && isReady) {
              audioRef.current.play().catch(e => console.log("Audio play blocked", e));
            }

            // Show toast
            toast({
              title: "🔔 New Order Received!",
              description: `Order #${order.orderId} from ${order.patientName || 'Customer'}`,
              action: (
                <div className="bg-primary/10 p-2 rounded-full">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                </div>
              ),
            });
          }
        }
      });
    });

    return () => unsubscribe();
  }, [db, isReady, toast]);

  return null; // This is a logic-only component
}
