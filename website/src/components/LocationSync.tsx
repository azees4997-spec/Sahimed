"use client";

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function LocationSync() {
  const { toast } = useToast();

  useEffect(() => {
    const syncLocation = async () => {
      // Check if location is already captured
      const savedLocation = localStorage.getItem('sahimed_location');
      if (savedLocation) return;

      const saveLocationData = (data: any) => {
        localStorage.setItem('sahimed_location', JSON.stringify({
          ...data,
          timestamp: new Date().getTime()
        }));
        console.log('[Location Intelligence] Position synchronized:', data.city || data.region);
      };

      // 1. Primary: Browser Geolocation
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);
              const data = await res.json();
              
              const locationInfo = {
                lat: latitude,
                lng: longitude,
                city: data.address?.city || data.address?.town || data.address?.village || 'Unknown City',
                region: data.address?.state,
                country: data.address?.country,
                source: 'gps'
              };
              
              saveLocationData(locationInfo);
              toast({
                title: "Location Synchronized",
                description: `Delivering to ${locationInfo.city}`,
              });
            } catch (e) {
              fallbackToIP();
            }
          },
          () => {
            fallbackToIP();
          },
          { timeout: 10000 }
        );
      } else {
        fallbackToIP();
      }

      // 2. Fallback: IP-based Location (Silent)
      async function fallbackToIP() {
        try {
          const res = await fetch('https://ipapi.co/json/');
          const data = await res.json();
          if (data && data.city) {
            const locationInfo = {
              lat: data.latitude,
              lng: data.longitude,
              city: data.city,
              region: data.region,
              country: data.country_name,
              source: 'ip'
            };
            saveLocationData(locationInfo);
          }
        } catch (e) {
          console.error('[Location Intelligence] Fallback sync failed.');
        }
      }
    };

    syncLocation();
  }, [toast]);

  return null; // Invisible component
}
