/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Locate,
  Navigation,
  AlertCircle,
  Search,
  RefreshCw,
  X,
  Plus,
  Minus,
  Layers,
  Zap,
  CheckCircle2,
  Upload,
  Camera,
  ShieldCheck,
  CreditCard,
  Award,
  Wrench,
  User,
  Building2,
  DollarSign,
  TrendingUp,
  MapPin,
  Users,
  RotateCcw,
  Copy,
  Check,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  LogOut,
  Lock,
  Mail,
  Snowflake,
  PowerOff,
  Calendar,
  Clock
} from 'lucide-react';

interface Referral {
  id: string;
  email: string;
  selfieUrl: string;
  idDocName: string;
  popDocName: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  date: string;
  activatedPlan: 'user' | 'tenant';
  expiryDate: string;
  isFrozen: boolean;
}

interface UserAccount {
  email: string;
  password: string;
  subscriptionState: 'none' | 'user' | 'tenant';
  selfieImage: string | null;
  idDocName: string | null;
  popDocName: string | null;
  isDisabled: boolean;
  isFrozen: boolean;
}

export default function App() {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const authMapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const searchMarkerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Authentication & Session State with localStorage persistence
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'authenticated'>(() => {
    return localStorage.getItem('saved_auth') ? 'authenticated' : 'signup';
  });

  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('registered_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentEmail, setCurrentEmail] = useState<string>(() => {
    return localStorage.getItem('current_email') || '';
  });

  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [acceptTerms, setAcceptTerms] = useState<boolean>(false);
  const [popupMessage, setPopupMessage] = useState<{ type: 'congrats' | 'welcome'; text: string } | null>(null);
  const [showSplash, setShowSplash] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const [position, setPosition] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [status, setStatus] = useState<'locating' | 'located' | 'error' | 'denied'>('locating');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [watchId, setWatchId] = useState<number | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(true);
  const [isSatellite, setIsSatellite] = useState<boolean>(false);

  // Activation & KYC Modal State
  const [showActivationModal, setShowActivationModal] = useState<boolean>(false);
  const [activationStep, setActivationStep] = useState<'plan' | 'kyc' | 'loading' | 'success'>('plan');
  const [selectedPlan, setSelectedPlan] = useState<'user' | 'tenant'>('user');

  const [subscriptionState, setSubscriptionState] = useState<'none' | 'user' | 'tenant'>(() => {
    const savedEmail = localStorage.getItem('current_email');
    const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
    const user = users.find((u: UserAccount) => u.email === savedEmail);
    return user ? user.subscriptionState : 'none';
  });

  // KYC Uploads State
  const [selfieImage, setSelfieImage] = useState<string | null>(() => {
    const savedEmail = localStorage.getItem('current_email');
    const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
    const user = users.find((u: UserAccount) => u.email === savedEmail);
    return user ? user.selfieImage : null;
  });

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [idDocFile, setIdDocFile] = useState<File | null>(null);
  const [popFile, setPopFile] = useState<File | null>(null);

  // Bottom Navigation Views ('map' | 'tenant-portal' | 'seekers' | 'gigs' | 'profile')
  const [activeView, setActiveView] = useState<'map' | 'tenant-portal' | 'seekers' | 'gigs' | 'profile'>('map');

  // Tenant portal financial & referral state
  const [userSubProfit, setUserSubProfit] = useState<number>(0.0);
  const [tenantSubProfit, setTenantSubProfit] = useState<number>(0.0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Referrals List for Tenant review
  const [referrals, setReferrals] = useState<Referral[]>(() => {
    const saved = localStorage.getItem('referral_list');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [referralCode, setReferralCode] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('ref');
  });

  const [showReferralsModal, setShowReferralsModal] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Smooth background music for Activation screen
  useEffect(() => {
    if (showActivationModal && activationStep === 'plan') {
      if (!audioRef.current) {
        // Using a stable direct MP3 link for ambient music
        audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.3;
      }
      
      const playAudio = () => {
        audioRef.current?.play().catch((err) => {
          console.warn('Audio playback delayed or blocked:', err);
          // Retry on next user interaction if blocked
          window.addEventListener('click', () => audioRef.current?.play(), { once: true });
        });
      };

      playAudio();
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [showActivationModal, activationStep]);

  const tenantReferralLink = `${window.location.origin}/?ref=tenant_${Math.abs(Math.sin(Date.now()))
    .toString(36)
    .substring(2, 9)}`;

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Custom pulsing location icon using Leaflet divIcon
  const userIcon = L.divIcon({
    className: 'custom-user-location-marker',
    html: `
      <div style="
        position: relative;
        width: 24px;
        height: 24px;
        background: #2563eb;
        border: 3px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(0,0,0,0.3);
      ">
        <div style="
          position: absolute;
          top: -6px;
          left: -6px;
          right: -6px;
          bottom: -6px;
          border: 2px solid #2563eb;
          border-radius: 50%;
          animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        "></div>
      </div>
      <style>
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(0.95); opacity: 0; }
        }
      </style>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  // Save registered users & current session to localStorage
  useEffect(() => {
    localStorage.setItem('registered_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    localStorage.setItem('referral_list', JSON.stringify(referrals));
  }, [referrals]);

  useEffect(() => {
    if (currentEmail) {
      localStorage.setItem('current_email', currentEmail);
      localStorage.setItem('saved_auth', 'true');
    } else {
      localStorage.removeItem('current_email');
      localStorage.removeItem('saved_auth');
    }
  }, [currentEmail]);

  // Update user profile in registeredUsers when subscriptionState or selfieImage changes
  useEffect(() => {
    if (!currentEmail) return;
    setRegisteredUsers((prev) =>
      prev.map((u) =>
        u.email === currentEmail
          ? { ...u, subscriptionState, selfieImage }
          : u
      )
    );
  }, [subscriptionState, selfieImage, currentEmail]);

  // Effect for activeView to invalidate map size instantly and prevent white screen
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 50);
    }
  }, [activeView]);

  // Effect to initialize map
  useEffect(() => {
    if (authMode !== 'authenticated') {
      if (!authMapContainerRef.current) return;
      const map = L.map(authMapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true,
      }).setView([20, 0], 2);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '',
        subdomains: ['a', 'b', 'c'],
        keepBuffer: 4,
      }).addTo(map);

      setTimeout(() => {
        if (authMapContainerRef.current) {
          map.invalidateSize();
        }
      }, 100);

      return () => {
        map.remove();
      };
    } else {
      if (!mapContainerRef.current) return;

      const savedCenter = localStorage.getItem('map_center');
      const savedZoom = localStorage.getItem('map_zoom');
      const initialCenter = savedCenter ? JSON.parse(savedCenter) : [20, 0];
      const initialZoom = savedZoom ? parseInt(savedZoom, 10) : 2;

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        preferCanvas: true,
      }).setView(initialCenter, initialZoom);

      const initialTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '',
        subdomains: ['a', 'b', 'c'],
        keepBuffer: 4,
        updateWhenIdle: false,
        updateWhenZooming: false,
      }).addTo(map);

      tileLayerRef.current = initialTileLayer;
      mapRef.current = map;

      map.on('dragstart', () => {
        setIsFollowing(false);
      });

      map.on('moveend', () => {
        const center = map.getCenter();
        localStorage.setItem('map_center', JSON.stringify([center.lat, center.lng]));
      });

      map.on('zoomend', () => {
        localStorage.setItem('map_zoom', map.getZoom().toString());
      });

      if (!savedCenter) {
        startGeolocation(map);
      } else {
        setStatus('located');
      }

      setTimeout(() => {
        map.invalidateSize();
      }, 100);

      return () => {
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
        }
        map.remove();
        mapRef.current = null;
      };
    }
  }, [authMode, showSplash]);

  const fetchLocationName = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      if (data && data.display_name) {
        const address = data.address;
        const shortName =
          address?.city ||
          address?.town ||
          address?.village ||
          address?.suburb ||
          address?.county ||
          address?.state ||
          data.display_name.split(',')[0];
        setLocationName(shortName);
      }
    } catch (err) {
      console.warn('Reverse geocoding error:', err);
    }
  };

  const updateMapLocation = (lat: number, lng: number, accuracy: number, map: L.Map) => {
    setPosition({ lat, lng, accuracy });
    setStatus('located');
    fetchLocationName(lat, lng);

    const newLatLng = new L.LatLng(lat, lng);

    if (markerRef.current) {
      markerRef.current.setLatLng(newLatLng);
    } else {
      const marker = L.marker(newLatLng, { icon: userIcon }).addTo(map);
      marker.bindPopup(`<b>Your Location</b><br>Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}<br>Accuracy: ±${Math.round(accuracy)}m`);
      markerRef.current = marker;
    }

    if (circleRef.current) {
      circleRef.current.setLatLng(newLatLng);
      circleRef.current.setRadius(accuracy);
    } else {
      const circle = L.circle(newLatLng, {
        radius: accuracy,
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
        weight: 1,
      }).addTo(map);
      circleRef.current = circle;
    }

    if (isFollowing) {
      map.setView(newLatLng, Math.max(map.getZoom(), 15));
    }
  };

  const startGeolocation = (mapInstance: L.Map) => {
    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMessage('Geolocation is not supported by your browser');
      return;
    }

    setStatus('locating');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        updateMapLocation(latitude, longitude, accuracy, mapInstance);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setStatus('denied');
          setErrorMessage('Location permission denied.');
        } else {
          setStatus('error');
          setErrorMessage(error.message || 'Unable to retrieve your location');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        if (mapRef.current) {
          updateMapLocation(latitude, longitude, accuracy, mapRef.current);
        }
      },
      (error) => {
        console.warn('Watch position error:', error);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
    );

    setWatchId(id);
  };

  const handleRecenter = () => {
    setIsFollowing(true);
    if (position && mapRef.current) {
      mapRef.current.setView([position.lat, position.lng], 16, { animate: true });
    } else if (mapRef.current) {
      startGeolocation(mapRef.current);
    }
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const toggleSatellite = () => {
    if (!mapRef.current) return;
    const nextSatellite = !isSatellite;
    setIsSatellite(nextSatellite);

    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }

    const newLayerUrl = nextSatellite
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const newLayer = L.tileLayer(newLayerUrl, {
      maxZoom: 19,
      attribution: '',
      subdomains: ['a', 'b', 'c'],
      keepBuffer: 4,
    }).addTo(mapRef.current);

    tileLayerRef.current = newLayer;
  };

  // Search suggestions
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
        );
        const data = await response.json();
        if (data && Array.isArray(data)) {
          setSearchSuggestions(data);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.warn('Nominatim search error:', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectLocation = (latStr: string, lonStr: string, displayName: string) => {
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (mapRef.current) {
      mapRef.current.setView([lat, lon], 15, { animate: true });

      if (searchMarkerRef.current) {
        searchMarkerRef.current.setLatLng([lat, lon]);
        searchMarkerRef.current.setPopupContent(`<b>${displayName}</b>`).openPopup();
      } else {
        const marker = L.marker([lat, lon]).addTo(mapRef.current);
        marker.bindPopup(`<b>${displayName}</b>`).openPopup();
        searchMarkerRef.current = marker;
      }
    }

    setSearchQuery(displayName);
    setShowSuggestions(false);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapRef.current) return;

    setShowSuggestions(false);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        handleSelectLocation(lat, lon, display_name);
      } else {
        alert('Location not found.');
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  // Camera handling with explicit permission request
  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera access permission error:', err);
      alert('Camera permission denied or unavailable. Please check your browser camera settings or upload a selfie image file instead.');
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setSelfieImage(dataUrl);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Web Audio API realistic success chime
  const playSuccessSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.08);

        gain.gain.setValueAtTime(0, ctx.currentTime + index * 0.08);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + index * 0.08 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.08 + 0.7);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + index * 0.08);
        osc.stop(ctx.currentTime + index * 0.08 + 0.7);
      });
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selfieImage) {
      alert('Please provide your face selfie picture.');
      return;
    }
    if (!idDocFile) {
      alert('ID Document is required. Please upload your ID document.');
      return;
    }
    if (!popFile) {
      alert('Proof of Payment is required. Please upload your proof of payment document.');
      return;
    }

    setActivationStep('loading');

    setTimeout(() => {
      setSubscriptionState(selectedPlan);
      
      const today = new Date();
      const thirtyDaysLater = new Date(today);
      thirtyDaysLater.setDate(today.getDate() + 30);
      
      // If user joined via referral, add them to the referrals list
      const newReferral: Referral = {
        id: `ref-${Date.now()}`,
        email: currentEmail,
        selfieUrl: selfieImage || '',
        idDocName: idDocFile?.name || 'document.pdf',
        popDocName: popFile?.name || 'payment.pdf',
        status: 'Pending',
        date: today.toISOString().split('T')[0],
        activatedPlan: selectedPlan,
        expiryDate: thirtyDaysLater.toISOString().split('T')[0],
        isFrozen: false,
      };

      setReferrals((prev) => [newReferral, ...prev]);
      
      setActivationStep('success');
      playSuccessSound();
    }, 3000);
  };

  const handleToggleFreezeReferral = (id: string) => {
    setReferrals((prev) =>
      prev.map((ref) => (ref.id === id ? { ...ref, isFrozen: !ref.isFrozen } : ref))
    );
  };

  const handleToggleDisableAccount = () => {
    if (!currentEmail) return;
    const isNowDisabled = !registeredUsers.find(u => u.email === currentEmail)?.isDisabled;
    
    setRegisteredUsers((prev) =>
      prev.map((u) =>
        u.email === currentEmail ? { ...u, isDisabled: isNowDisabled } : u
      )
    );

    if (isNowDisabled) {
      alert('Your account has been disabled. You will be logged out.');
      handleLogout();
    }
  };

  const handleResetApp = () => {
    setSubscriptionState('none');
    setSelfieImage(null);
    setIdDocFile(null);
    setPopFile(null);
    setActiveView('map');
    setShowActivationModal(false);
    setActivationStep('plan');
    setUserSubProfit(0.0);
    setTenantSubProfit(0.0);
    
    const today = new Date();
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(today.getDate() + 30);
    const expiryStr = thirtyDaysLater.toISOString().split('T')[0];

    setReferrals([]);
  };

  const handleLogout = () => {
    setAuthMode('login');
    setCurrentEmail('');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      alert('Please provide email and password.');
      return;
    }
    if (!acceptTerms) {
      alert('You must accept the Terms and Conditions to register.');
      return;
    }

    const existing = registeredUsers.find((u) => u.email === authEmail);
    if (!existing) {
      const newAccount: UserAccount = {
        email: authEmail,
        password: authPassword,
        subscriptionState: 'none',
        selfieImage: null,
        idDocName: null,
        popDocName: null,
        isDisabled: false,
        isFrozen: false,
      };
      setRegisteredUsers((prev) => [...prev, newAccount]);
    }

    setCurrentEmail(authEmail);
    setAuthMode('authenticated');
    setPopupMessage({ type: 'congrats', text: 'Congratulations! Your account has been successfully created.' });
    playSuccessSound();
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = registeredUsers.find(
      (u) => u.email === authEmail && u.password === authPassword
    );

    if (!found && registeredUsers.length > 0) {
      alert('Invalid email or password. Please try again.');
      return;
    }

    if (found && found.isDisabled) {
      alert('This account has been disabled. Please contact support.');
      return;
    }

    // Restore user profile data if found
    if (found) {
      setSubscriptionState(found.subscriptionState);
      setSelfieImage(found.selfieImage);
    }

    setCurrentEmail(authEmail);
    setAuthMode('authenticated');
    setPopupMessage({ type: 'welcome', text: `Welcome Back, ${authEmail || 'User'}!` });
    playSuccessSound();
  };

  const handleUpdateReferralStatus = (id: string, status: 'Approved' | 'Rejected') => {
    setReferrals((prev) =>
      prev.map((ref) => (ref.id === id ? { ...ref, status } : ref))
    );
  };

  if (showSplash) {
    return (
      <div className="fixed inset-0 z-[100] bg-blue-600 flex items-center justify-center animate-in fade-in duration-500">
        <div className="text-white text-6xl font-black tracking-tighter drop-shadow-2xl animate-pulse">
          TimeGiG
        </div>
      </div>
    );
  }

  // If user is not authenticated (login or signup screen)
  if (authMode !== 'authenticated') {
    return (
      <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center">
        {/* Map as background wallpaper */}
        <div ref={authMapContainerRef} className="absolute inset-0 z-0" />

        {/* Smaller Signup / Login Card on top */}
        <div className="relative z-10 w-11/12 max-w-sm bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200/80 p-6 space-y-5 animate-in fade-in zoom-in duration-300">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-extrabold text-gray-900">
              {authMode === 'signup' ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-xs text-gray-500">
              {authMode === 'signup' ? 'Register with email & password' : 'Login with your credentials'}
            </p>
          </div>

          {authMode === 'signup' ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="terms" className="text-[11px] text-gray-600 select-none">
                  I accept the <span className="text-blue-600 font-semibold">Terms and Conditions</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-lg shadow-blue-500/25 transition-all"
              >
                Register & Join
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  Already have an account? Login
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-lg shadow-blue-500/25 transition-all"
              >
                Login
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  Need an account? Register
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden pb-20">
      {/* Pop-up congratulations or welcome back */}
      {popupMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-sm p-6 text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <Award className="w-8 h-8 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900">
                {popupMessage.type === 'congrats' ? 'Welcome & Congratulations!' : 'Welcome Back!'}
              </h3>
              <p className="text-xs text-gray-600">{popupMessage.text}</p>
            </div>
            <button
              onClick={() => setPopupMessage(null)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md transition-all"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Map View (always active in background) */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 z-0 bottom-16"
      />

      {/* Top Bar: Search Bar & Status (Shown on map and gigs views) */}
      {(activeView === 'map' || activeView === 'gigs') && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-xl flex flex-col items-center">
          <form onSubmit={handleSearchSubmit} className="w-full relative flex items-center shadow-2xl">
            <div className="absolute left-4 text-gray-400 pointer-events-none">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchSuggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder="Search area, street, location, province..."
              className="w-full pl-12 pr-10 py-3.5 bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 text-gray-900 text-sm md:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white shadow-md transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchSuggestions([]);
                  setShowSuggestions(false);
                  if (searchMarkerRef.current && mapRef.current) {
                    mapRef.current.removeLayer(searchMarkerRef.current);
                    searchMarkerRef.current = null;
                  }
                }}
                className="absolute right-4 text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md rounded-xl border border-gray-200 shadow-xl overflow-hidden z-30 max-h-64 overflow-y-auto">
                {searchSuggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectLocation(item.lat, item.lon, item.display_name)}
                    className="px-4 py-3 text-xs md:text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-900 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors flex items-start gap-2"
                  >
                    <Search className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{item.display_name}</span>
                  </div>
                ))}
              </div>
            )}
          </form>

          <div className="mt-2 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-md border border-gray-200/80 flex items-center gap-2">
            {status === 'locating' && <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />}
            {status === 'located' && <Navigation className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />}
            {(status === 'error' || status === 'denied') && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
            <span className="text-xs text-gray-700 font-medium">
              {status === 'locating' && 'Locating you...'}
              {status === 'located' && (locationName ? `${locationName}` : position ? `${position.lat.toFixed(3)}, ${position.lng.toFixed(3)}` : 'Location active')}
              {status === 'denied' && 'Location permission denied'}
              {status === 'error' && (errorMessage || 'Location unavailable')}
            </span>
          </div>
        </div>
      )}

      {/* Floating Bubble Cluster (Zoom, Satellite toggle, Recenter) - Bottom Right (Shown on map and gigs views) */}
      {(activeView === 'map' || activeView === 'gigs') && (
        <div className="absolute bottom-24 right-6 z-20 flex flex-col bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
          <button
            onClick={toggleSatellite}
            className={`p-3 transition-colors flex items-center justify-center ${
              isSatellite ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
            title={isSatellite ? 'Switch to Street View' : 'Switch to Satellite View'}
            aria-label="Toggle Satellite View"
          >
            <Layers className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-3 text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-3 text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <Minus className="w-5 h-5" />
          </button>
          <button
            onClick={handleRecenter}
            className={`p-3 transition-colors flex items-center justify-center ${
              isFollowing ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-100'
            }`}
            title="Recenter on my location"
            aria-label="Recenter on my location"
          >
            <Locate className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Tenant Portal View */}
      {activeView === 'tenant-portal' && (
        <div className="absolute inset-0 z-10 bg-gray-50 overflow-y-auto p-4 md:p-6 pb-28">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selfieImage ? (
                  <img src={selfieImage} alt="Tenant Avatar" className="w-10 h-10 rounded-lg object-cover shadow-sm border-2 border-emerald-500" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base shadow-sm">
                    TP
                  </div>
                )}
                <div>
                  <h1 className="text-lg font-extrabold text-gray-900">Tenant Portal</h1>
                  <p className="text-[10px] text-emerald-600 font-semibold leading-tight">Tenant Sub Active (R299,99/mo)</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded-full shadow-sm flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            </div>

            {/* Referral Link Card */}
            <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 space-y-1.5">
              <h3 className="text-[11px] font-bold text-gray-900">Your Tenant Referral Link</h3>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={tenantReferralLink}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] text-gray-700 font-mono select-all"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(tenantReferralLink);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-semibold flex items-center gap-1 shadow-sm transition-all flex-shrink-0"
                >
                  {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[9px] text-gray-500">Share this link to invite users and grow your referral network.</p>
            </div>

            {/* Stats: Total Referrals (Clickable), User Sub Profit, Tenant Sub Profit */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div
                onClick={() => setShowReferralsModal(true)}
                className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:border-blue-500 cursor-pointer transition-all group"
                title="Click to view all referrals"
              >
                <div className="flex items-center justify-between text-gray-500 mb-0.5">
                  <span className="text-[9px] font-semibold uppercase group-hover:text-blue-600 transition-colors">Total Referrals</span>
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{referrals.length}</h3>
                <p className="text-[9px] text-blue-600 mt-0.5 underline">View, Approve & Reject</p>
              </div>

              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between text-gray-500 mb-0.5">
                  <span className="text-[9px] font-semibold uppercase">User Sub Profit</span>
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">R {userSubProfit.toFixed(2)}</h3>
                <p className="text-[9px] text-emerald-600 mt-0.5">From user subscriptions</p>
              </div>

              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between text-gray-500 mb-0.5">
                  <span className="text-[9px] font-semibold uppercase">Tenant Sub Profit</span>
                  <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">R {tenantSubProfit.toFixed(2)}</h3>
                <p className="text-[9px] text-purple-600 mt-0.5">From tenant referrals</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Referrals Review Modal */}
      {showReferralsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex flex-col p-2 md:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl mx-auto my-auto overflow-hidden flex flex-col max-h-[95vh]">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-1.5">
                <div className="p-1 bg-blue-100 text-blue-600 rounded-md">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900 leading-tight">Referrals & KYC Verification</h2>
                  <p className="text-[9px] text-gray-500 leading-tight">Review email, selfie, ID, and payment status</p>
                </div>
              </div>
              <button
                onClick={() => setShowReferralsModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {referrals.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-xs">No referrals found yet.</div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {referrals.map((ref) => (
                    <div
                      key={ref.id}
                      className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={ref.selfieUrl}
                          alt="Selfie"
                          className={`w-12 h-12 rounded-xl object-cover border-2 shadow-sm flex-shrink-0 ${ref.isFrozen ? 'border-blue-300 grayscale' : 'border-blue-500'}`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 text-sm">{ref.email}</h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                ref.status === 'Approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : ref.status === 'Rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {ref.status}
                            </span>
                            {ref.isFrozen && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1">
                                <Snowflake className="w-2.5 h-2.5" /> Frozen
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`px-1.5 py-0.5 rounded border text-[9px] font-semibold ${ref.activatedPlan === 'tenant' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                              {ref.activatedPlan === 'tenant' ? 'Tenant Sub' : 'User Sub'}
                            </span>
                            <div className="flex items-center gap-1 text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                              <Clock className="w-2.5 h-2.5" /> Expiry: {ref.expiryDate}
                            </div>
                            <p className="text-[10px] text-gray-500">on {ref.date}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2 py-1.5 rounded-lg text-[10px] text-gray-700">
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span className="font-medium truncate max-w-[100px]">{ref.idDocName}</span>
                          <button
                            onClick={() => alert(`Viewing ID Document: ${ref.idDocName}`)}
                            className="p-0.5 hover:bg-gray-200 rounded text-blue-600"
                            title="View ID"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2 py-1.5 rounded-lg text-[10px] text-gray-700">
                          <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-medium truncate max-w-[100px]">{ref.popDocName}</span>
                          <button
                            onClick={() => alert(`Viewing Proof of Payment: ${ref.popDocName}`)}
                            className="p-0.5 hover:bg-gray-200 rounded text-emerald-600"
                            title="View POP"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        <button
                          onClick={() => handleToggleFreezeReferral(ref.id)}
                          className={`px-3 py-1.5 font-semibold rounded-lg text-[10px] shadow-sm transition-all flex items-center gap-1 ${
                            ref.isFrozen 
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          title={ref.isFrozen ? 'Unfreeze Account' : 'Freeze Account'}
                        >
                          {ref.isFrozen ? <RefreshCw className="w-3.5 h-3.5" /> : <Snowflake className="w-3.5 h-3.5" />}
                          {ref.isFrozen ? 'Unfreeze' : 'Freeze'}
                        </button>
                        <button
                          onClick={() => handleUpdateReferralStatus(ref.id, 'Approved')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-[10px] shadow-sm transition-all flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleUpdateReferralStatus(ref.id, 'Rejected')}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-[10px] shadow-sm transition-all flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowReferralsModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg text-[10px] transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seekers View */}
      {activeView === 'seekers' && (
        <div className="absolute inset-0 z-10 bg-gray-50 overflow-y-auto p-6 md:p-10 pb-28">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">Seekers Directory</h1>
                <p className="text-sm text-gray-500">Find active service providers, verified tenants, and seekers in your area</p>
              </div>
              <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Sipho Dlamini', role: 'Verified Tenant & Provider', location: 'Johannesburg, GP', rating: '4.9' },
                { name: 'Lerato Mokoena', role: 'Active User Seeker', location: 'Pretoria, GP', rating: '4.8' },
                { name: 'David van Der Merwe', role: 'Local Map Seeker', location: 'Cape Town, WC', rating: '5.0' },
              ].map((seeker, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      {seeker.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{seeker.name}</h3>
                      <p className="text-xs text-gray-500">{seeker.role}</p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {seeker.location}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl">
                    ★ {seeker.rating}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}



      {/* Profile View */}
      {activeView === 'profile' && (
        <div className="absolute inset-0 z-10 bg-gray-50 overflow-y-auto p-6 md:p-10 pb-28">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-4">
                {selfieImage ? (
                  <img src={selfieImage} alt="User Profile Logo" className="w-20 h-20 rounded-2xl object-cover shadow-md border-2 border-blue-500 flex-shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-2xl shadow-md flex-shrink-0">
                    UP
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900">User Profile</h1>
                  <p className="text-sm font-semibold text-blue-600">
                    {subscriptionState === 'tenant' ? 'Tenant Sub (Active)' : subscriptionState === 'user' ? 'User Sub (Active)' : 'Not Activated'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">ID & KYC Verified successfully</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl transition-all shadow-sm flex items-center gap-2 font-semibold text-xs"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
              <h3 className="text-base font-bold text-gray-900">Account Details</h3>
              <div className="divide-y divide-gray-100 text-xs text-gray-700">
                <div className="py-2.5 flex justify-between">
                  <span className="font-medium text-gray-500">Subscription Plan</span>
                  <span className="font-bold text-gray-900">
                    {subscriptionState === 'tenant' ? 'Tenant Sub (R299,99/mo)' : subscriptionState === 'user' ? 'User Sub (R29,99/mo)' : 'None'}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="font-medium text-gray-500">ID Document</span>
                  <span className="font-bold text-emerald-600">{idDocFile ? 'Verified & Attached' : 'Not Attached'}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="font-medium text-gray-500">Proof of Payment</span>
                  <span className="font-bold text-emerald-600">{popFile ? 'Verified & Attached' : 'Not Attached'}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="font-medium text-gray-500">Profile Logo Source</span>
                  <span className="font-bold text-blue-600">{selfieImage ? 'Captured / Uploaded Selfie' : 'Default'}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowActivationModal(true);
                  setActivationStep('plan');
                }}
                className="flex-1 py-3 bg-white hover:bg-gray-50 text-blue-600 border border-blue-200 font-semibold rounded-xl text-xs transition-all shadow-sm"
              >
                Change / Upgrade Subscription Plan
              </button>
              <button
                onClick={handleToggleDisableAccount}
                className="py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 font-semibold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
                title="Disable Account"
              >
                <PowerOff className="w-4 h-4 text-gray-500" /> Disable Account
              </button>
              <button
                onClick={handleResetApp}
                className="py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
                title="Reset App"
              >
                <RotateCcw className="w-4 h-4" /> Reset App
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Menu Bar (Docked at the bottom, GiGs icon bigger and other icons smaller, no boxes) */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 py-3 px-6 shadow-2xl flex items-center justify-around">
        {subscriptionState === 'tenant' ? (
          // Tenant Sub Activated: TenantPortal (smaller), GiGs (BIGGER), Profile (smaller)
          <>
            <button
              onClick={() => setActiveView('tenant-portal')}
              className={`flex flex-col items-center gap-1 group focus:outline-none ${activeView === 'tenant-portal' ? 'text-emerald-600 font-bold' : 'text-gray-500 font-medium'}`}
              title="Tenant"
            >
              <Building2 className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="text-[10px]">Tenant</span>
            </button>

            <button
              onClick={() => setActiveView('gigs')}
              className={`flex flex-col items-center gap-1 group focus:outline-none ${activeView === 'gigs' ? 'text-blue-600 font-bold' : 'text-gray-500 font-medium'}`}
              title="GiGs"
            >
              <Wrench className="w-9 h-9 transition-transform group-hover:scale-110" />
              <span className="text-xs">GiGs</span>
            </button>

            <button
              onClick={() => setActiveView('profile')}
              className={`flex flex-col items-center gap-1 group focus:outline-none ${activeView === 'profile' ? 'text-blue-600 font-bold' : 'text-gray-500 font-medium'}`}
              title="Profile"
            >
              {selfieImage ? (
                <img src={selfieImage} alt="Profile" className="w-6 h-6 rounded-full object-cover transition-transform group-hover:scale-110" />
              ) : (
                <User className="w-5 h-5 transition-transform group-hover:scale-110" />
              )}
              <span className="text-[10px]">Profile</span>
            </button>
          </>
        ) : subscriptionState === 'user' ? (
          // User Sub Activated: Seekers (smaller), GiGs (BIGGER), Profile (smaller)
          <>
            <button
              onClick={() => setActiveView('seekers')}
              className={`flex flex-col items-center gap-1 group focus:outline-none ${activeView === 'seekers' ? 'text-blue-600 font-bold' : 'text-gray-500 font-medium'}`}
              title="Seekers"
            >
              <Users className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="text-[10px]">Seekers</span>
            </button>

            <button
              onClick={() => setActiveView('gigs')}
              className={`flex flex-col items-center gap-1 group focus:outline-none ${activeView === 'gigs' ? 'text-blue-600 font-bold' : 'text-gray-500 font-medium'}`}
              title="GiGs"
            >
              <Wrench className="w-9 h-9 transition-transform group-hover:scale-110" />
              <span className="text-xs">GiGs</span>
            </button>

            <button
              onClick={() => setActiveView('profile')}
              className={`flex flex-col items-center gap-1 group focus:outline-none ${activeView === 'profile' ? 'text-blue-600 font-bold' : 'text-gray-500 font-medium'}`}
              title="Profile"
            >
              {selfieImage ? (
                <img src={selfieImage} alt="Profile" className="w-6 h-6 rounded-full object-cover transition-transform group-hover:scale-110" />
              ) : (
                <User className="w-5 h-5 transition-transform group-hover:scale-110" />
              )}
              <span className="text-[10px]">Profile</span>
            </button>
          </>
        ) : (
          // Not Activated / New User: ONLY the Activation feature icon (bigger, no box)
          <div className="flex items-center justify-center w-full">
            <button
              onClick={() => {
                setShowActivationModal(true);
                setActivationStep('plan');
              }}
              className="flex flex-col items-center gap-1 group focus:outline-none text-blue-600 font-bold"
              title="Activation"
            >
              <Zap className="w-9 h-9 transition-transform group-hover:scale-110" />
              <span className="text-xs">Activation</span>
            </button>
          </div>
        )}
      </div>

      {/* Activation Modal */}
      {showActivationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Account Activation & KYC</h2>
                  <p className="text-xs text-gray-500">
                    {activationStep === 'plan' && 'Step 1 of 2: Choose your subscription'}
                    {activationStep === 'kyc' && 'Step 2 of 2: Verification & Documents (Required)'}
                    {activationStep === 'loading' && 'Processing Activation...'}
                    {activationStep === 'success' && 'Congratulations!'}
                  </p>
                </div>
              </div>
              {activationStep !== 'loading' && (
                <button
                  onClick={() => {
                    setShowActivationModal(false);
                    stopCamera();
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              {activationStep === 'plan' && (
                <div className="space-y-6">
                  <p className="text-sm text-gray-600">
                    Please select one subscription plan below to proceed with account activation:
                  </p>

                  <div className="grid grid-cols-1 gap-4">
                    {/* User Sub Box */}
                    <div
                      onClick={() => setSelectedPlan('user')}
                      className={`cursor-pointer rounded-2xl border-2 p-5 transition-all flex items-start gap-4 ${
                        selectedPlan === 'user'
                          ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="subscription"
                        checked={selectedPlan === 'user'}
                        onChange={() => setSelectedPlan('user')}
                        className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-gray-900 text-base">User Sub</h3>
                          <span className="text-blue-600 font-extrabold text-base">R29,99<span className="text-xs text-gray-500 font-normal">/mo</span></span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Full access to use the app and all interactive map navigation features.
                        </p>
                      </div>
                    </div>

                    {/* Tenant Sub Box */}
                    <div
                      onClick={() => setSelectedPlan('tenant')}
                      className={`cursor-pointer rounded-2xl border-2 p-5 transition-all flex items-start gap-4 ${
                        selectedPlan === 'tenant'
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="subscription"
                        checked={selectedPlan === 'tenant'}
                        onChange={() => setSelectedPlan('tenant')}
                        className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-gray-900 text-base">Tenant Sub</h3>
                          <span className="text-emerald-600 font-extrabold text-base">R299,99<span className="text-xs text-gray-500 font-normal">/mo</span></span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Become a tenant and earn a passive monthly income from user subscriptions. Keeps your tenant account active.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActivationStep('kyc')}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Verification</span>
                  </button>
                </div>
              )}

              {activationStep === 'kyc' && (
                <form onSubmit={handleFinalSubmit} className="space-y-6">
                  {/* Selfie Upload / Capture */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center justify-between">
                      <span>1. Face Selfie Picture <span className="text-red-500">*</span></span>
                      {selfieImage && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Attached</span>}
                    </label>
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-4 bg-gray-50">
                      {selfieImage ? (
                        <div className="relative w-32 h-32 rounded-xl overflow-hidden shadow-md">
                          <img src={selfieImage} alt="Selfie" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setSelfieImage(null)}
                            className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full text-xs"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : isCameraActive ? (
                        <div className="relative w-full max-w-xs rounded-xl overflow-hidden bg-black">
                          <video ref={videoRef} className="w-full h-48 object-cover" autoPlay playsInline />
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 bg-blue-600 text-white rounded-full font-semibold text-xs shadow-lg flex items-center gap-1.5"
                          >
                            <Camera className="w-4 h-4" /> Capture Photo
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                          <button
                            type="button"
                            onClick={startCamera}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
                          >
                            <Camera className="w-4 h-4" /> Request Camera & Capture
                          </button>
                          <label className="px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all">
                            <Upload className="w-4 h-4" /> Upload Selfie File
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => setSelfieImage(ev.target?.result as string);
                                  reader.readAsDataURL(e.target.files[0]);
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ID Document Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center justify-between">
                      <span>2. ID Document (Required) <span className="text-red-500">*</span></span>
                      {idDocFile && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Attached</span>}
                    </label>
                    <label className={`flex items-center justify-between border-2 border-dashed rounded-2xl p-4 transition-all cursor-pointer ${idDocFile ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-200 bg-gray-50 hover:bg-gray-100/50'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${idDocFile ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-800">
                            {idDocFile ? idDocFile.name : 'Upload ID card or passport (Required)'}
                          </p>
                          <p className="text-[10px] text-gray-500">PDF, PNG, JPG up to 10MB</p>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-lg ${idDocFile ? 'text-emerald-700 bg-emerald-100' : 'text-blue-600 bg-blue-50'}`}>
                        {idDocFile ? 'Change' : 'Browse'}
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        required
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setIdDocFile(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Proof of Payment Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center justify-between">
                      <span>3. Proof of Payment Document (Required) <span className="text-red-500">*</span></span>
                      {popFile && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Attached</span>}
                    </label>
                    <label className={`flex items-center justify-between border-2 border-dashed rounded-2xl p-4 transition-all cursor-pointer ${popFile ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-200 bg-gray-50 hover:bg-gray-100/50'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${popFile ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-800">
                            {popFile ? popFile.name : 'Upload proof of payment slip (Required)'}
                          </p>
                          <p className="text-[10px] text-gray-500">PDF, PNG, JPG up to 10MB</p>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-lg ${popFile ? 'text-emerald-700 bg-emerald-100' : 'text-emerald-600 bg-emerald-50'}`}>
                        {popFile ? 'Change' : 'Browse'}
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        required
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setPopFile(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActivationStep('plan')}
                      className="w-1/3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="w-2/3 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                    >
                      <span>Submit Verification</span>
                    </button>
                  </div>
                </form>
              )}

              {activationStep === 'loading' && (
                <div className="py-12 flex flex-col items-center text-center space-y-6">
                  <div className="relative flex items-center justify-center">
                    <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="absolute">
                      <Zap className="w-8 h-8 text-blue-600 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-gray-900">Processing Your Activation...</h3>
                    <p className="text-xs text-gray-500">Verifying your documents and securing your subscription...</p>
                  </div>
                </div>
              )}

              {activationStep === 'success' && (
                <div className="py-8 flex flex-col items-center text-center space-y-4 animate-in fade-in duration-300">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                    <Award className="w-10 h-10 animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-extrabold text-gray-900">Congratulations!</h3>
                    <p className="text-sm font-semibold text-emerald-600">
                      Your {selectedPlan === 'tenant' ? 'Tenant Sub (R299,99/mo)' : 'User Sub (R29,99/mo)'} is successfully activated!
                    </p>
                  </div>
                  <p className="text-xs text-gray-600 max-w-xs">
                    {selectedPlan === 'tenant'
                      ? 'You are now a registered tenant. Your account is active to earn passive monthly income from user subscriptions.'
                      : 'Your user subscription is now active. Enjoy full access to Seekers, GiGs, and Profile features!'}
                  </p>
                  <button
                    onClick={() => {
                      setShowActivationModal(false);
                      setActivationStep('plan');
                      setActiveView('profile');
                    }}
                    className="mt-4 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-lg shadow-blue-500/25 transition-all"
                  >
                    View Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
