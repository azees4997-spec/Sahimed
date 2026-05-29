"use client";

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/context/CartContext';

export default function LocationSync() {
  const { toast } = useToast();
  const { setLocation } = useCart();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hasRedirected = sessionStorage.getItem('sahimed_app_redirected');
    const isAndroid = /Android/i.test(navigator.userAgent);

    if (isAndroid && !hasRedirected) {
      sessionStorage.setItem('sahimed_app_redirected', 'true');
      const currentPath = window.location.pathname + window.location.search;
      const intentUrl = `intent://sahimed.com${currentPath}#Intent;scheme=https;package=com.sahimed.app;fallback=${encodeURIComponent(window.location.href)};end`;
      window.location.href = intentUrl;
    }
  }, []);

  useEffect(() => {
    const syncLocation = async () => {
      // Check if location is already captured
      const savedLocation = localStorage.getItem('sahimed_location');
      if (savedLocation && savedLocation !== "Mumbai, MH") return;

      const saveLocationData = (data: any) => {
        const cityValue = data.city || data.region || 'Unknown';
        localStorage.setItem('sahimed_location', JSON.stringify({
          ...data,
          timestamp: new Date().getTime()
        }));
        setLocation(cityValue);
        console.log('[Location Intelligence] Position synchronized:', cityValue);
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
                city: data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || data.address?.city_district || 'Detected Location',
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
