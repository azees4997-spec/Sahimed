"use client"

import { useEffect, useRef, useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Bell, ShoppingBag } from 'lucide-react';

// Using a clean, professional notification sound
const ORDER_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

export function OrderNotification() {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const lastCheckTime = useRef<string>(new Date().toISOString());

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
    let isMounted = true;

    const checkNewOrders = async () => {
      try {
        const res = await fetch(`/api/orders/check-new?since=${encodeURIComponent(lastCheckTime.current)}`);
        if (!res.ok) return;
        
        const data = await res.json();
        const orders = data.orders || [];

        if (orders.length > 0 && isMounted) {
          // Play sound
          if (audioRef.current && isReady) {
            audioRef.current.play().catch(e => console.log("Audio play blocked", e));
          }

          // Show toasts for each new order
          orders.forEach((order: any) => {
            toast({
              title: "🔔 New MongoDB Order!",
              description: `Order #${order.orderId} from ${order.patientName || 'Customer'} (₹${order.totalAmount})`,
              action: (
                <div className="bg-primary/10 p-2 rounded-full">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                </div>
              ),
            });
          });
        }
        
        // Update the timestamp for the next check
        if (data.serverTime) {
          lastCheckTime.current = data.serverTime;
        }
      } catch (err) {
        console.error("Failed to check for new orders:", err);
      }
    };

    // Poll every 10 seconds for new orders
    const interval = setInterval(checkNewOrders, 10000);
    
    // Initial check
    checkNewOrders();

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isReady, toast]);

  return null;
}
