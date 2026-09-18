"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  UploadCloud,
  CheckCircle2,
  Phone,
  ArrowLeft,
  X,
  Lock,
  ShieldAlert,
  Tag,
  Plane,
  Repeat,
  Gift,
  Package,
  Sparkles,
  Smartphone,
  Car,
  Home,
  Shirt,
  Building,
  Bike,
  Briefcase,
  Baby,
  PawPrint,
  Palette,
  ChevronRight,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { TUNISIAN_LOCATIONS } from '@/lib/tunisianLocations';
import { createListing, updateListingInDb, fetchProductById, uploadImageToStorage, getUserProfileFromDb } from '@/lib/firestoreService';
import { auth, onAuthStateChanged } from '@/lib/firebase';
import { showError } from '@/lib/swal';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import TextField from '@/components/create-listing/TextField';
import SelectField from '@/components/create-listing/SelectField';
import ToggleCard from '@/components/create-listing/ToggleCard';
import StepProgress from '@/components/create-listing/StepProgress';

const EXPANDED_CATEGORIES = [
  { id: 'electronics', label: '📱 Multimédia & High-Tech', icon: Smartphone, desc: 'Smartphones, PC portable, Consoles, TV, Tablettes...' },
  { id: 'vehicles', label: '🚗 Véhicules & Pièces Auto', icon: Car, desc: 'Voitures, Motos, Camions, Pièces de rechange...' },
  { id: 'home', label: '🏠 Maison, Jardin & Déco', icon: Home, desc: 'Meubles, Électroménager, Bricolage, Jardinage...' },
  { id: 'fashion', label: '👗 Mode, Vêtements & Accessoires', icon: Shirt, desc: 'Friperie, Chaussures, Sacs, Montres, Bijoux...' },
  { id: 'realestate', label: '🏢 Immobilier (Vente & Location)', icon: Building, desc: 'Appartements, Villas, Terrains, Bureaux, Studios...' },
  { id: 'sports', label: '⚽ Sports, Loisirs & Vélos', icon: Bike, desc: 'Vélos, Musculation, Camping, Instruments de musique...' },
  { id: 'jobs', label: '💼 Emploi, Services & Cours', icon: Briefcase, desc: 'Offres d’emploi, Services à domicile, Cours particuliers...' },
  { id: 'baby', label: '👶 Bébé, Enfants & Jouets', icon: Baby, desc: 'Poussettes, Sièges auto, Jouets, Vêtements bébé...' },
  { id: 'pets', label: '🐾 Animaux & Accessoires', icon: PawPrint, desc: 'Chiens, Chats, Oiseaux, Alimentation, Accessoires...' },
  { id: 'art', label: '🎨 Art, Collection & Antiquités', icon: Palette, desc: 'Tableaux, Sculptures, Pièces anciennes, Antiquités...' }
];

const CATEGORY_CONFIGS = {
  electronics: {
    titlePlaceholder: "Ex: iPhone 13 Pro Max 256Go Bleu avec boîte / MacBook Pro M1 16GB...",
    conditions: [
      "Neuf / Emballé",
      "Comme neuf (Peu utilisé)",
      "Très bon état",
      "Bon état (Traces d'usage)",
      "Écran fêlé / À réparer",
      "Pour pièces / Incomplet"
    ]
  },
  vehicles: {
    titlePlaceholder: "Ex: Peugeot 208 1.2 PureTech 2021 TBE / Golf 7 GTD Boîte Auto...",
    conditions: [
      "Neuf (Kilométrage zéro)",
      "Très bon état (Carnet à jour)",
      "Bon état (Quelques rayures)",
      "À rénover / Accidenté",
      "Épave / Pour pièces"
    ]
  },
  realestate: {
    titlePlaceholder: "Ex: Appartement S+2 Haut Standing à Louer - La Marsa / Villa 400m² avec jardin...",
    conditions: [
      "Neuf / Jamais habité",
      "Très bon état",
      "À rafraîchir / Travaux mineurs",
      "À rénover entièrement"
    ]
  },
  fashion: {
    titlePlaceholder: "Ex: Veste en Cuir Noir Zara Taille M / Baskets Nike Air Force 1 Neufs T42...",
    conditions: [
      "Neuf avec étiquette",
      "Neuf sans étiquette",
      "Très bon état",
      "Bon état"
    ]
  },
  home: {
    titlePlaceholder: "Ex: Canapé d'angle convertible 3 places / Table à manger bois massif + 6 chaises...",
    conditions: [
      "Neuf dans l'emballage",
      "Très bon état",
      "Bon état (Traces d'usage)",
      "À restaurer / Bricolage"
    ]
  },
  sports: {
    titlePlaceholder: "Ex: Vélo VTT Rockrider ST540 / Tapis de course pliable Domyos...",
    conditions: [
      "Neuf / Sous emballage",
      "Très bon état",
      "Bon état",
      "À réviser"
    ]
  },
  jobs: {
    titlePlaceholder: "Ex: Recherche Développeur Web React / Cours particuliers Mathématiques Bac...",
    conditions: [
      "Disponibilité immédiate",
      "Temps plein",
      "Temps partiel",
      "Freelance / Mission",
      "Stage / Alternance"
    ]
  },
  baby: {
    titlePlaceholder: "Ex: Poussette Trio Chicco avec Cosy / Lit bébé en bois évolutif...",
    conditions: [
      "Neuf sous scellé",
      "Très bon état (Désinfecté)",
      "Bon état"
    ]
  },
  pets: {
    titlePlaceholder: "Ex: Chatons Persans de race 2 mois / Cage pour oiseaux XL avec accessoires...",
    conditions: [
      "Bébé (-3 mois)",
      "Jeune (3-12 mois)",
      "Adulte",
      "Vacciné & Pucé",
      "Avec Carnet de Santé complet"
    ]
  },
  art: {
    titlePlaceholder: "Ex: Tableau peinture à l'huile original / Pièce de monnaie ancienne 1920...",
    conditions: [
      "Pièce unique / Originale",
      "Excellent état de conservation",
      "État d'origine / Patiné",
      "À restaurer"
    ]
  }
};

const STEP_TRANSITION = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

const REDUCED_TRANSITION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

function CreateListingContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('editId') || null;
  const isEditMode = Boolean(editId);
  const [loadingExisting, setLoadingExisting] = useState(isEditMode);
  const prefersReducedMotion = useReducedMotion();
  const motionProps = prefersReducedMotion ? REDUCED_TRANSITION : STEP_TRANSITION;

  // Step 1: Category, Step 2: Details, Step 3: Photos, Step 4: Pricing & Location
  const [currentStep, setCurrentStep] = useState(1);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Category Selection First
  const [category, setCategory] = useState('');

  // Basic Details (Category dependent)
  const [title, setTitle] = useState('');
  const [condition, setCondition] = useState('');
  const [description, setDescription] = useState('');

  // Extended Category Specific Fields
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [storageCapacity, setStorageCapacity] = useState('128Go');
  const [batteryHealth, setBatteryHealth] = useState('100%');
  const [accessories, setAccessories] = useState('');

  const [mileage, setMileage] = useState('');
  const [year, setYear] = useState('2021');
  const [fuel, setFuel] = useState('Essence');
  const [transmission, setTransmission] = useState('Manuelle');
  const [fiscalPower, setFiscalPower] = useState('5 CV');
  const [color, setColor] = useState('');

  const [contractType, setContractType] = useState('Vente'); // Vente / Location
  const [propertyType, setPropertyType] = useState('Appartement');
  const [surface, setSurface] = useState('');
  const [rooms, setRooms] = useState('S+2');
  const [bathrooms, setBathrooms] = useState('1');
  const [furnished, setFurnished] = useState(false);
  const [elevator, setElevator] = useState(false);

  const [size, setSize] = useState('M');
  const [gender, setGender] = useState('Unisex');
  const [material, setMaterial] = useState('');

  const [jobType, setJobType] = useState("Offre d'emploi");
  const [experienceLevel, setExperienceLevel] = useState('1-3 ans');

  const [petType, setPetType] = useState('Chat');
  const [petBreed, setPetBreed] = useState('');
  const [vaccinated, setVaccinated] = useState(true);

  const [babyCategory, setBabyCategory] = useState('Poussette / Siège Auto');

  const [artEra, setArtEra] = useState('Contemporain');

  // Pricing & Selling Options
  const [price, setPrice] = useState('');
  const [priceType, setPriceType] = useState('negotiable'); // 'negotiable' | 'fixed' | 'free'
  const [isImported, setIsImported] = useState(false);
  const [allowTrade, setAllowTrade] = useState(false);
  const [availability, setAvailability] = useState('in_stock');

  // Location & Contact (24 Governorates)
  const [selectedGov, setSelectedGov] = useState('Tunis');
  const [selectedCity, setSelectedCity] = useState(TUNISIAN_LOCATIONS['Tunis'][0]);
  const [phone, setPhone] = useState('+216 ');

  // Photos & Submission
  const [imageFiles, setImageFiles] = useState([]);
  const [images, setImages] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  const clearFieldError = (key) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Auth Guard & Preload User Phone & Location — always sourced from the
  // seller's own profile, never re-asked per listing (see phoneVerified gate
  // below: publishing is blocked until the profile has a verified phone).
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setAuthChecking(false);
        const profile = await getUserProfileFromDb(user.uid);
        setPhone(profile?.phoneNumber || '+216 ');
        setPhoneVerified(!!profile?.isPhoneVerified);
        if (profile?.selectedGov) {
          setSelectedGov(profile.selectedGov);
        }
        if (profile?.selectedCity) {
          setSelectedCity(profile.selectedCity);
        }
        setProfileLoading(false);
      } else {
        setCurrentUser(null);
        setAuthChecking(false);
        setProfileLoading(false);
        router.push('/auth');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Edit mode: load the existing listing and prefill every field once auth resolves
  useEffect(() => {
    if (!currentUser || !editId) return;
    let cancelled = false;

    (async () => {
      setLoadingExisting(true);
      try {
        const listing = await fetchProductById(editId);
        if (!listing) {
          showError('Annonce introuvable', "Cette annonce n'existe pas ou a été supprimée.");
          router.push('/profile?tab=listings');
          return;
        }

        const ownerId = listing.sellerId || listing.seller?.id;
        if (ownerId !== currentUser.uid) {
          showError('Accès refusé', "Vous ne pouvez modifier que vos propres annonces.");
          router.push('/profile?tab=listings');
          return;
        }
        if (cancelled) return;

        setCategory(listing.category || '');
        setTitle(listing.title || '');
        setCondition(listing.condition || '');
        setDescription(listing.description || '');

        const d = listing.details || {};
        setBrand(d.brand || '');
        setModel(d.model || '');
        setStorageCapacity(d.storageCapacity || '128Go');
        setBatteryHealth(d.batteryHealth || '100%');
        setAccessories(d.accessories || '');
        setMileage(d.mileage || '');
        setYear(d.year || '2021');
        setFuel(d.fuel || 'Essence');
        setTransmission(d.transmission || 'Manuelle');
        setFiscalPower(d.fiscalPower || '5 CV');
        setColor(d.color || '');
        setContractType(d.contractType || 'Vente');
        setPropertyType(d.propertyType || 'Appartement');
        setSurface(d.surface || '');
        setRooms(d.rooms || 'S+2');
        setBathrooms(d.bathrooms || '1');
        setFurnished(Boolean(d.furnished));
        setElevator(Boolean(d.elevator));
        setSize(d.size || 'M');
        setGender(d.gender || 'Unisex');
        setMaterial(d.material || '');
        setJobType(d.jobType || "Offre d'emploi");
        setExperienceLevel(d.experienceLevel || '1-3 ans');
        setPetType(d.petType || 'Chat');
        setPetBreed(d.petBreed || '');
        setVaccinated(d.vaccinated !== false);
        setBabyCategory(d.babyCategory || 'Poussette / Siège Auto');
        setArtEra(d.artEra || 'Contemporain');

        setPriceType(listing.priceType || (listing.isFree ? 'free' : listing.negotiable ? 'negotiable' : 'fixed'));
        setPrice(listing.isFree ? '0' : String(listing.price ?? ''));
        setIsImported(Boolean(listing.isImported));
        setAllowTrade(Boolean(listing.allowTrade));
        setAvailability(listing.availability || 'in_stock');

        const existingImages = listing.images?.length > 0 ? listing.images : (listing.image ? [listing.image] : []);
        setImages(existingImages);
        setImageFiles(new Array(existingImages.length).fill(null));
      } catch (err) {
        console.warn('Load listing for edit error:', err);
        showError('Erreur de chargement', "Impossible de charger l'annonce à modifier.");
        router.push('/profile?tab=listings');
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    })();

    return () => { cancelled = true; };
  }, [currentUser, editId, router]);

  // When category changes, set default condition & reset title placeholder
  const handleSelectCategory = (catId) => {
    setCategory(catId);
    const config = CATEGORY_CONFIGS[catId];
    if (config && config.conditions.length > 0) {
      setCondition(config.conditions[0]);
    }
    clearFieldError('category');
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    if (files.length > 0) {
      if (images.length + files.length > 6) {
        setFieldErrors((prev) => ({ ...prev, images: 'Maximum 6 photos autorisées.' }));
        return;
      }
      clearFieldError('images');
      setImageFiles(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Step Validation & Progression
  const handleNextStep = (e) => {
    e.preventDefault();
    if (currentStep === 1) {
      if (!category) {
        setFieldErrors({ category: 'Veuillez choisir une catégorie pour commencer.' });
        return;
      }
      setFieldErrors({});
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const errors = {};
      if (!title.trim() || title.length < 4) {
        errors.title = 'Le titre doit comporter au moins 4 caractères.';
      }
      if (!description.trim() || description.length < 15) {
        errors.description = 'La description doit comporter au moins 15 caractères.';
      }
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
      setFieldErrors({});
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (images.length === 0) {
        setFieldErrors({ images: 'Veuillez ajouter au moins une photo de votre objet.' });
        return;
      }
      setFieldErrors({});
      setCurrentStep(4);
    }
  };

  const canReachStep = (n) => {
    if (n === 1) return true;
    if (n === 2) return Boolean(category);
    if (n === 3) return Boolean(category && title && description);
    if (n === 4) return Boolean(category && title && description && images.length > 0);
    return false;
  };

  const handleStepClick = (n) => {
    setFieldErrors({});
    setCurrentStep(n);
  };

  const isDirty = Boolean(title.trim() || description.trim() || images.length > 0 || (price && price !== '0'));
  const cancelHref = isEditMode ? '/profile?tab=listings' : '/';

  const handleCancelClick = () => {
    if (isDirty) {
      setShowCancelConfirm(true);
    } else {
      router.push(cancelHref);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const rawNum = phone.trim();
    const cleaned = rawNum.replace(/[\s\-\(\)]/g, '');
    const isTunisian = /^(?:\+216|216)?[24579]\d{7}$/.test(cleaned);

    if (!rawNum || !isTunisian) {
      showError(
        'Numéro de téléphone invalide',
        "Le numéro enregistré sur votre profil n'est pas un numéro tunisien valide. Veuillez le corriger dans votre profil avant de publier."
      );
      setSubmitting(false);
      return;
    }

    let formattedPhone = cleaned;
    if (!formattedPhone.startsWith('+216')) {
      if (formattedPhone.startsWith('216')) {
        formattedPhone = '+' + formattedPhone;
      } else {
        formattedPhone = '+216' + formattedPhone;
      }
    }

    try {
      // Index-aligned with `images`: a File means a new upload, null/undefined
      // means that slot is already an existing hosted URL (edit mode) to keep as-is.
      const resolvedImages = [];
      for (let i = 0; i < images.length; i++) {
        const file = imageFiles[i];
        if (file) {
          const firestoreUrl = await uploadImageToStorage(file, 'ads', currentUser?.uid);
          resolvedImages.push(firestoreUrl || images[i]);
        } else {
          resolvedImages.push(images[i]);
        }
      }

      const finalImages = resolvedImages.length > 0 ? resolvedImages : ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80'];

      const finalPrice = priceType === 'free' ? 0 : (parseFloat(price) || 0);

      const newListing = {
        title: title.trim(),
        category,
        price: finalPrice,
        priceType,
        negotiable: priceType === 'negotiable',
        isFree: priceType === 'free',
        isImported,
        allowTrade,
        availability,
        condition,
        description: description.trim(),
        details: {
          brand: brand || null,
          model: model || null,
          storageCapacity: category === 'electronics' ? storageCapacity : null,
          batteryHealth: category === 'electronics' ? batteryHealth : null,
          accessories: category === 'electronics' ? accessories : null,

          mileage: category === 'vehicles' ? mileage : null,
          year: category === 'vehicles' ? year : null,
          fuel: category === 'vehicles' ? fuel : null,
          transmission: category === 'vehicles' ? transmission : null,
          fiscalPower: category === 'vehicles' ? fiscalPower : null,
          color: category === 'vehicles' ? color : null,

          contractType: category === 'realestate' ? contractType : null,
          propertyType: category === 'realestate' ? propertyType : null,
          surface: category === 'realestate' ? surface : null,
          rooms: category === 'realestate' ? rooms : null,
          bathrooms: category === 'realestate' ? bathrooms : null,
          furnished: category === 'realestate' ? furnished : null,
          elevator: category === 'realestate' ? elevator : null,

          size: category === 'fashion' ? size : null,
          gender: category === 'fashion' ? gender : null,
          material: category === 'fashion' ? material : null,

          jobType: category === 'jobs' ? jobType : null,
          experienceLevel: category === 'jobs' ? experienceLevel : null,

          petType: category === 'pets' ? petType : null,
          petBreed: category === 'pets' ? petBreed : null,
          vaccinated: category === 'pets' ? vaccinated : null,

          babyCategory: category === 'baby' ? babyCategory : null,

          artEra: category === 'art' ? artEra : null,
        },
        image: finalImages[0],
        images: finalImages,
        governorate: selectedGov,
        city: selectedCity,
        location: `${selectedCity}, ${selectedGov}, Tunisie`,
        seller: {
          id: currentUser?.uid || `seller-${Date.now()}`,
          name: currentUser?.displayName || currentUser?.email || 'Vendeur Connecté',
          avatar: currentUser?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
          rating: 5.0,
          verified: true,
          location: `${selectedCity}, ${selectedGov}`,
          phone: phone.trim()
        }
      };

      if (isEditMode) {
        await updateListingInDb(editId, newListing);
      } else {
        await createListing(newListing);
      }

      // Push + email confirmation are sent server-side by a Cloud Function
      // triggered on this Firestore write (see functions/index.js).

      setSubmitting(false);
      setSubmitted(true);

      setTimeout(() => {
        router.push('/profile?tab=listings');
      }, 1500);
    } catch (err) {
      console.warn("Submit listing error:", err);
      showError(
        isEditMode ? "Échec de la mise à jour" : "Échec de la publication",
        err?.message || "Une erreur est survenue lors de l'enregistrement de l'annonce."
      );
      setSubmitting(false);
    }
  };

  if (authChecking || profileLoading || loadingExisting) {
    return (
      <div className="max-w-4xl mx-auto p-12 flex flex-col items-center gap-3 text-center text-xs font-bold text-[#868685]">
        <Loader2 className="w-6 h-6 text-[#0e0f0c] animate-spin" />
        {authChecking || profileLoading ? 'Vérification du compte...' : "Chargement de l'annonce à modifier..."}
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-[#e8ebe6] shadow-xl text-center space-y-4 font-body text-[#454745] animate-rise-in">
        <div className="w-16 h-16 rounded-full bg-[#e2f6d5] text-[#0e0f0c] flex items-center justify-center mx-auto border border-[#0e0f0c]/10">
          <Lock className="w-8 h-8 text-[#0e0f0c]" />
        </div>
        <h2 className="text-2xl font-heading font-extrabold text-[#0e0f0c]">Connexion Requise</h2>
        <p className="text-xs text-[#868685]">Vous devez être connecté pour publier une annonce sur TanitMarket.</p>
        <Button href="/auth" variant="primary" size="md">
          Se Connecter / S'inscrire
        </Button>
      </div>
    );
  }

  if (!phoneVerified) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-[#e8ebe6] shadow-xl text-center space-y-4 font-body text-[#454745] animate-rise-in">
        <div className="w-16 h-16 rounded-full bg-[#fff5da] text-[#b86700] flex items-center justify-center mx-auto border border-[#0e0f0c]/10">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-heading font-extrabold text-[#0e0f0c]">Numéro de téléphone requis</h2>
        <p className="text-xs text-[#868685]">
          Votre annonce utilisera automatiquement la localisation et le numéro de téléphone de votre profil.
          Veuillez d'abord ajouter et vérifier votre numéro par SMS.
        </p>
        <Button href="/profile?tab=settings" variant="primary" size="md">
          Vérifier mon téléphone
        </Button>
      </div>
    );
  }

  const activeConfig = CATEGORY_CONFIGS[category] || {
    titlePlaceholder: "Ex: Décrivez votre annonce avec un titre clair...",
    conditions: ["Neuf", "Comme neuf", "Très bon état", "Bon état", "À réparer"]
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 sm:space-y-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-28 font-body text-[#454745]">

      {/* Page Header */}
      <div className="flex items-center justify-between gap-3 animate-rise-in">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-3xl font-heading font-extrabold text-[#0e0f0c] truncate">
            {isEditMode ? "Modifier l'annonce" : 'Déposer une annonce'}
          </h1>
          <p className="text-xs text-[#868685]">
            {isEditMode ? 'Mettez à jour les informations de votre annonce' : 'Publication guidée étape par étape partout en Tunisie 🇹🇳'}
          </p>
        </div>
        <Button
          variant="tertiary"
          size="sm"
          icon={ArrowLeft}
          onClick={handleCancelClick}
          className="shrink-0 [&_svg]:rtl:rotate-180"
        >
          <span className="hidden sm:inline">Annuler</span>
        </Button>
      </div>

      {/* 4-Step Progressive Navigation Bar */}
      {!submitted && (
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#e8ebe6] shadow-xs animate-rise-in">
          <StepProgress currentStep={currentStep} canReach={canReachStep} onStepClick={handleStepClick} />
        </div>
      )}

      {submitted ? (
          <motion.div
            key="success"
            {...motionProps}
            transition={{ duration: prefersReducedMotion ? 0.15 : 0.3 }}
            className="card-tanit-panel p-10 sm:p-12 text-center space-y-4 shadow-xl"
          >
            <div className="w-16 h-16 rounded-full bg-[#e2f6d5] text-[#0e0f0c] flex items-center justify-center mx-auto border border-[#0e0f0c]/10">
              <CheckCircle2 className="w-10 h-10 text-[#0e0f0c]" />
            </div>
            <h2 className="text-2xl font-heading font-extrabold text-[#0e0f0c]">
              {isEditMode ? 'Annonce Mise à Jour avec Succès !' : 'Annonce Publiée avec Succès !'}
            </h2>
            <p className="text-sm text-[#868685] max-w-md mx-auto">
              Votre annonce <span className="font-bold text-[#0e0f0c]">{title}</span>{' '}
              {isEditMode
                ? 'a été mise à jour et sera de nouveau soumise à modération.'
                : 'a été enregistrée et transmise à nos modérateurs.'}
            </p>
          </motion.div>
        ) : (
          <form
            onSubmit={currentStep === 4 ? handleSubmit : handleNextStep}
            className="card-tanit-panel p-5 sm:p-8 space-y-6 shadow-xl border border-[#e8ebe6]"
          >
              <motion.div key={currentStep} initial={motionProps.initial} animate={motionProps.animate} transition={{ duration: prefersReducedMotion ? 0.15 : 0.25, ease: [0.4, 0, 0.2, 1] }}>

                {/* STEP 1: SÉLECTION PRIORITAIRE DE LA CATÉGORIE */}
                {currentStep === 1 && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between border-b border-[#e8ebe6] pb-3">
                      <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#0e0f0c] flex items-center gap-2">
                        <Tag className="w-5 h-5 text-[#0e0f0c] shrink-0" />
                        <span>Étape 1 — Choisissez d'abord la catégorie</span>
                      </h3>
                    </div>

                    <p className="text-xs text-[#868685]">
                      Sélectionnez la catégorie adaptée pour débloquer les formulaires spécifiques et dynamiques.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2" role="radiogroup" aria-label="Catégorie de l'annonce">
                      {EXPANDED_CATEGORIES.map(cat => {
                        const IconComponent = cat.icon;
                        const isSelected = category === cat.id;
                        return (
                          <div
                            key={cat.id}
                            role="radio"
                            aria-checked={isSelected}
                            tabIndex={0}
                            onClick={() => handleSelectCategory(cat.id)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectCategory(cat.id); } }}
                            className={`min-h-11 p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e0f0c] ${
                              isSelected
                                ? 'bg-[#e2f6d5] border-[#0e0f0c] ring-2 ring-[#0e0f0c]/20 shadow-md'
                                : 'bg-white border-[#e8ebe6] hover:border-[#0e0f0c]/40 hover:bg-[#e8ebe6]'
                            }`}
                          >
                            <div className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                              isSelected ? 'bg-[#0e0f0c] text-[#9FE870]' : 'bg-[#e2f6d5] text-[#0e0f0c]'
                            }`}>
                              <IconComponent className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-extrabold text-xs text-[#0e0f0c] flex items-center justify-between gap-2">
                                <span>{cat.label}</span>
                                {isSelected && <CheckCircle2 className="w-4 h-4 text-[#0e0f0c] shrink-0" />}
                              </h4>
                              <p className="text-[11px] text-[#868685] mt-0.5 line-clamp-1">{cat.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {fieldErrors.category && (
                      <p className="text-xs font-bold text-[#a72027] bg-[#FFEDE8] border border-[#a72027]/20 rounded-lg p-3">
                        {fieldErrors.category}
                      </p>
                    )}

                  </div>
                )}

                {/* STEP 2: DÉTAILS DYNAMIQUES SELON LA CATÉGORIE SÉLECTIONNÉE */}
                {currentStep === 2 && (
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e8ebe6] pb-3">
                      <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#0e0f0c] flex items-center gap-2 min-w-0">
                        <Sparkles className="w-5 h-5 text-[#0e0f0c] shrink-0" />
                        <span className="truncate">Étape 2 — {EXPANDED_CATEGORIES.find(c => c.id === category)?.label}</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="text-xs font-bold text-[#0e0f0c] hover:underline shrink-0"
                      >
                        Changer de catégorie
                      </button>
                    </div>

                    <TextField
                      label="Titre de l'annonce"
                      required
                      size="lg"
                      placeholder={activeConfig.titlePlaceholder}
                      value={title}
                      onChange={(e) => { setTitle(e.target.value); clearFieldError('title'); }}
                      error={fieldErrors.title}
                      helper={!fieldErrors.title ? "Le titre s'adapte à la catégorie sélectionnée pour maximiser la visibilité." : undefined}
                    />

                    <SelectField
                      label="État de l'objet / du bien / du service"
                      required
                      size="lg"
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      options={activeConfig.conditions}
                    />

                    {/* CHAMPS SPÉCIFIQUES APPROFONDIS PAR CATÉGORIE */}
                    <div className="p-4 bg-[#e8ebe6] rounded-2xl border border-[#e8ebe6] space-y-4">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-[#0e0f0c]">
                        <Sparkles className="w-4 h-4 text-[#0e0f0c]" />
                        <span>Caractéristiques techniques sur-mesure</span>
                      </div>

                      {/* 1. Multimédia & High-Tech */}
                      {category === 'electronics' && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <TextField label="Marque :" placeholder="Ex: Apple, Samsung, Dell, Sony..." value={brand} onChange={(e) => setBrand(e.target.value)} />
                          <TextField label="Modèle :" placeholder="Ex: iPhone 13 Pro, Galaxy S22, PS5..." value={model} onChange={(e) => setModel(e.target.value)} />
                          <SelectField
                            label="Capacité Stockage :"
                            value={storageCapacity}
                            onChange={(e) => setStorageCapacity(e.target.value)}
                            options={[
                              { value: '64Go', label: '64 Go' },
                              { value: '128Go', label: '128 Go' },
                              { value: '256Go', label: '256 Go' },
                              { value: '512Go', label: '512 Go' },
                              { value: '1To', label: '1 To' },
                            ]}
                          />
                          <TextField label="Santé Batterie (%) :" placeholder="Ex: 88% / Origine" value={batteryHealth} onChange={(e) => setBatteryHealth(e.target.value)} />
                          <TextField className="sm:col-span-2" label="Accessoires Inclus :" placeholder="Ex: Boîte d'origine, Chargeur rapide, Facture, Garantie..." value={accessories} onChange={(e) => setAccessories(e.target.value)} />
                        </div>
                      )}

                      {/* 2. Véhicules & Pièces Auto */}
                      {category === 'vehicles' && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <TextField label="Marque :" placeholder="Ex: Peugeot, Volkswagen, FIAT..." value={brand} onChange={(e) => setBrand(e.target.value)} />
                          <TextField label="Modèle :" placeholder="Ex: 208, Golf 7, Polo..." value={model} onChange={(e) => setModel(e.target.value)} />
                          <TextField type="number" label="Année :" placeholder="Ex: 2021" value={year} onChange={(e) => setYear(e.target.value)} />
                          <TextField type="number" label="Kilométrage (km) :" placeholder="Ex: 110000" value={mileage} onChange={(e) => setMileage(e.target.value)} />
                          <SelectField
                            label="Carburant :"
                            value={fuel}
                            onChange={(e) => setFuel(e.target.value)}
                            options={[
                              { value: 'Essence', label: 'Essence' },
                              { value: 'Diesel', label: 'Diesel (Gazoil)' },
                              { value: 'Hybride', label: 'Hybride' },
                              { value: 'Électrique', label: 'Électrique' },
                              { value: 'GPL', label: 'GPL' },
                            ]}
                          />
                          <SelectField
                            label="Boîte de vitesse :"
                            value={transmission}
                            onChange={(e) => setTransmission(e.target.value)}
                            options={[
                              { value: 'Manuelle', label: 'Manuelle' },
                              { value: 'Automatique', label: 'Automatique' },
                            ]}
                          />
                          <TextField label="Puissance Fiscale :" placeholder="Ex: 5 CV" value={fiscalPower} onChange={(e) => setFiscalPower(e.target.value)} />
                          <TextField label="Couleur :" placeholder="Ex: Noir Métallisé, Blanc..." value={color} onChange={(e) => setColor(e.target.value)} />
                        </div>
                      )}

                      {/* 3. Immobilier */}
                      {category === 'realestate' && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <SelectField
                            label="Type de Contrat :"
                            value={contractType}
                            onChange={(e) => setContractType(e.target.value)}
                            options={[
                              { value: 'Vente', label: 'Vente (Achat)' },
                              { value: 'Location', label: 'Location Longue Durée' },
                              { value: 'Location Vacances', label: 'Location Vacances / Nuitée' },
                            ]}
                          />
                          <SelectField
                            label="Type de Bien :"
                            value={propertyType}
                            onChange={(e) => setPropertyType(e.target.value)}
                            options={[
                              { value: 'Appartement', label: 'Appartement' },
                              { value: 'Villa', label: 'Villa / Maison' },
                              { value: 'Studio', label: 'Studio / Chambre' },
                              { value: 'Terrain', label: 'Terrain' },
                              { value: 'Bureau', label: 'Local Commercial / Bureau' },
                            ]}
                          />
                          <TextField type="number" label="Surface (m²) :" placeholder="Ex: 120" value={surface} onChange={(e) => setSurface(e.target.value)} />
                          <SelectField
                            label="Chambres :"
                            value={rooms}
                            onChange={(e) => setRooms(e.target.value)}
                            options={[
                              { value: 'S+0', label: 'S+0 (Studio)' },
                              { value: 'S+1', label: 'S+1 (2 pièces)' },
                              { value: 'S+2', label: 'S+2 (3 pièces)' },
                              { value: 'S+3', label: 'S+3 (4 pièces)' },
                              { value: 'S+4+', label: 'S+4 et plus' },
                            ]}
                          />
                          <div className="flex flex-wrap items-center pt-1 gap-2.5 col-span-2 sm:col-span-4">
                            <ToggleCard checked={furnished} onChange={setFurnished} label="Meublé" className="flex-1 min-w-[140px]" />
                            <ToggleCard checked={elevator} onChange={setElevator} label="Ascenseur" className="flex-1 min-w-[140px]" />
                          </div>
                        </div>
                      )}

                      {/* 4. Mode & Vêtements */}
                      {category === 'fashion' && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <TextField label="Taille / Pointure :" placeholder="Ex: M, L, 38, 42..." value={size} onChange={(e) => setSize(e.target.value)} />
                          <SelectField
                            label="Genre :"
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            options={[
                              { value: 'Unisex', label: 'Mixte / Unisex' },
                              { value: 'Homme', label: 'Homme' },
                              { value: 'Femme', label: 'Femme' },
                              { value: 'Enfant', label: 'Enfant' },
                            ]}
                          />
                          <TextField label="Marque :" placeholder="Ex: Zara, Nike, Adidas..." value={brand} onChange={(e) => setBrand(e.target.value)} />
                        </div>
                      )}

                      {/* 5. Emploi & Services */}
                      {category === 'jobs' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <SelectField
                            label="Type d'Annonce :"
                            value={jobType}
                            onChange={(e) => setJobType(e.target.value)}
                            options={[
                              { value: "Offre d'emploi", label: "Offre d'emploi (Recrutement)" },
                              { value: "Demande d'emploi", label: "Demande d'emploi (Candidat)" },
                              { value: 'Service / Dépannage', label: 'Service & Dépannage' },
                              { value: 'Cours / Formation', label: 'Cours particuliers & Formation' },
                            ]}
                          />
                          <SelectField
                            label="Expérience Requise :"
                            value={experienceLevel}
                            onChange={(e) => setExperienceLevel(e.target.value)}
                            options={[
                              { value: 'Débutant', label: 'Débutant / Sans expérience' },
                              { value: '1-3 ans', label: '1 à 3 ans' },
                              { value: '3-5 ans', label: '3 à 5 ans' },
                              { value: 'Senior 5+ ans', label: 'Senior (5 ans et +)' },
                            ]}
                          />
                        </div>
                      )}

                      {/* 6. Animaux */}
                      {category === 'pets' && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <SelectField
                            label="Type d'Animal :"
                            value={petType}
                            onChange={(e) => setPetType(e.target.value)}
                            options={[
                              { value: 'Chat', label: 'Chat' },
                              { value: 'Chien', label: 'Chien' },
                              { value: 'Oiseaux', label: 'Oiseaux' },
                              { value: 'Poissons', label: 'Poissons' },
                              { value: 'Autres', label: 'Autres rongeurs/animaux' },
                            ]}
                          />
                          <TextField label="Race :" placeholder="Ex: Persan, Berger Allemand..." value={petBreed} onChange={(e) => setPetBreed(e.target.value)} />
                          <ToggleCard checked={vaccinated} onChange={setVaccinated} label="Vacciné & Carnet à jour" className="sm:mt-5" />
                        </div>
                      )}

                      {/* Default fallback info for other categories */}
                      {!['electronics', 'vehicles', 'realestate', 'fashion', 'jobs', 'pets'].includes(category) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <TextField label="Marque / Fabricant :" placeholder="Ex: IKEA, Decathlon, Chicco..." value={brand} onChange={(e) => setBrand(e.target.value)} />
                        </div>
                      )}
                    </div>

                    <TextField
                      label="Description détaillée"
                      required
                      multiline
                      size="lg"
                      rows={4}
                      placeholder="Décrivez l'objet, son état précis, les accessoires inclus et les conditions de remise en main propre..."
                      value={description}
                      onChange={(e) => { setDescription(e.target.value); clearFieldError('description'); }}
                      error={fieldErrors.description}
                    />

                  </div>
                )}

                {/* STEP 3: PHOTOS */}
                {currentStep === 3 && (
                  <div className="space-y-5">
                    <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#0e0f0c] border-b border-[#e8ebe6] pb-2">
                      Étape 3 — Photos de l'annonce (Max 6)
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <label className="border-2 border-dashed border-[#0e0f0c]/30 hover:border-[#0e0f0c] rounded-xl h-36 flex flex-col items-center justify-center cursor-pointer bg-[#e8ebe6] hover:bg-[#e2f6d5] transition-colors p-3 text-center">
                        <UploadCloud className="w-8 h-8 text-[#0e0f0c] mb-1" />
                        <span className="text-xs font-bold text-[#0e0f0c]">Ajouter des photos</span>
                        <span className="text-[9px] text-[#868685]">JPG, PNG, WEBP (Max 5Mo)</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>

                      {images.map((img, idx) => (
                        <motion.div
                          key={img + idx}
                          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2 }}
                          className="relative h-36 rounded-xl overflow-hidden border border-[#e8ebe6] group bg-white shadow-2xs"
                        >
                          <img src={img} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                          {idx === 0 && (
                            <span className="absolute bottom-2 left-2 bg-[#0e0f0c] text-[#9FE870] font-black text-[9px] px-2 py-0.5 rounded-full">
                              Couverture
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            aria-label={`Supprimer la photo ${idx + 1}`}
                            className="absolute top-1.5 right-1.5 w-8 h-8 flex items-center justify-center bg-[#0e0f0c] text-white rounded-full hover:bg-[#a72027] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </div>

                    {fieldErrors.images && (
                      <p className="text-xs font-bold text-[#a72027] bg-[#FFEDE8] border border-[#a72027]/20 rounded-lg p-3">
                        {fieldErrors.images}
                      </p>
                    )}

                  </div>
                )}

                {/* STEP 4: PRIX & MENTIONS */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#0e0f0c] border-b border-[#e8ebe6] pb-2">
                      Étape 4 — Prix & Mentions de Vente
                    </h3>

                    {/* Conditions Financières / Prix */}
                    <div className="space-y-3 p-4 bg-[#e8ebe6] rounded-2xl border border-[#e8ebe6]">
                      <label className="block text-xs font-extrabold text-[#0e0f0c]">
                        Conditions financières / Prix *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setPriceType('negotiable')}
                          className={`min-h-11 p-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                            priceType === 'negotiable'
                              ? 'bg-[#0e0f0c] text-[#9FE870] border-[#0e0f0c]'
                              : 'bg-white text-[#0e0f0c] border-[#e8ebe6] hover:bg-[#e2f6d5]'
                          }`}
                        >
                          <span>Prix Négociable</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPriceType('fixed')}
                          className={`min-h-11 p-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                            priceType === 'fixed'
                              ? 'bg-[#0e0f0c] text-[#9FE870] border-[#0e0f0c]'
                              : 'bg-white text-[#0e0f0c] border-[#e8ebe6] hover:bg-[#e2f6d5]'
                          }`}
                        >
                          <span>Prix Fixe</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPriceType('free');
                            setPrice('0');
                          }}
                          className={`min-h-11 p-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                            priceType === 'free'
                              ? 'bg-[#0e0f0c] text-[#9FE870] border-[#0e0f0c]'
                              : 'bg-white text-[#0e0f0c] border-[#e8ebe6] hover:bg-[#e2f6d5]'
                          }`}
                        >
                          <Gift className="w-4 h-4 text-[#9FE870]" />
                          <span>Gratuit / Don 🎁</span>
                        </button>
                      </div>

                      {priceType !== 'free' && (
                        <div className="pt-2 max-w-xs">
                          <TextField
                            type="number"
                            step="1"
                            required
                            label="Prix (en Dinars Tunisiens TND)"
                            placeholder="Ex: 250"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            inputClassName="pr-14 text-sm font-black"
                          />
                        </div>
                      )}
                    </div>

                    {/* Badges & Mentions Spéciales */}
                    <div className="space-y-3 p-4 bg-white rounded-2xl border border-[#e8ebe6]">
                      <label className="block text-xs font-extrabold text-[#0e0f0c]">
                        Mentions & Caractéristiques Spéciales
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <ToggleCard
                          checked={isImported}
                          onChange={setIsImported}
                          icon={Plane}
                          label="Importé ✈️"
                          description="Importé de l'étranger"
                        />
                        <ToggleCard
                          checked={allowTrade}
                          onChange={setAllowTrade}
                          icon={Repeat}
                          label="Échange accepté 🔄"
                          description="Ouvert aux échanges"
                        />
                        <div className="min-h-11 p-3 rounded-xl bg-[#e8ebe6] border border-[#e8ebe6] space-y-1">
                          <span className="font-extrabold text-xs text-[#0e0f0c] block flex items-center gap-1">
                            <Package className="w-3.5 h-3.5 text-[#0e0f0c]" /> Disponibilité
                          </span>
                          <select
                            value={availability}
                            onChange={(e) => setAvailability(e.target.value)}
                            className="w-full text-xs font-bold bg-transparent focus:outline-none text-[#0e0f0c] cursor-pointer"
                          >
                            <option value="in_stock">En stock immédiatement</option>
                            <option value="on_order">Sur commande</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Localisation & Téléphone — sourcés automatiquement du profil vendeur,
                        plus jamais redemandés annonce par annonce. */}
                    <div className="p-4 bg-[#e2f6d5] rounded-2xl border border-[#0e0f0c]/10 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <span className="text-xs font-extrabold text-[#0e0f0c] flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5" /> Coordonnées utilisées pour cette annonce
                        </span>
                        <p className="text-xs text-[#454745]">
                          📍 {selectedCity}, {selectedGov} · 📞 {phone}
                        </p>
                      </div>
                      <Link
                        href="/profile?tab=settings"
                        className="text-[11px] font-bold text-[#0e0f0c] underline underline-offset-2 shrink-0"
                      >
                        Modifier dans mon profil
                      </Link>
                    </div>

                  </div>
                )}

              </motion.div>

              {/* Persistent action bar — Back/Continue stay reachable without
                  scrolling through long steps, fixed above the mobile nav bar. */}
              <div className="fixed inset-x-0 bottom-0 z-40 px-4 sm:px-6 lg:px-8 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:pb-4 pointer-events-none animate-rise-in">
                <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md border border-[#0e0f0c]/10 rounded-2xl shadow-xl p-3 flex items-center gap-3 pointer-events-auto">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      icon={ChevronLeft}
                      onClick={() => setCurrentStep(currentStep - 1)}
                      className="justify-center shrink-0 [&_svg]:rtl:rotate-180"
                    >
                      <span className="hidden sm:inline">Précédent</span>
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="primary"
                    size={currentStep === 4 ? 'lg' : 'md'}
                    iconRight={currentStep === 4 ? undefined : ChevronRight}
                    disabled={currentStep === 1 && !category}
                    loading={currentStep === 4 && submitting}
                    className="justify-center flex-1 [&_svg]:rtl:rotate-180"
                  >
                    {currentStep === 1 && 'Continuer vers les détails'}
                    {currentStep === 2 && 'Continuer vers les photos'}
                    {currentStep === 3 && 'Continuer vers le prix'}
                    {currentStep === 4 && (
                      submitting
                        ? (isEditMode ? 'Mise à jour en cours...' : 'Publication en cours...')
                        : (isEditMode ? 'Enregistrer les modifications ✅' : 'Publier mon annonce 🚀')
                    )}
                  </Button>
                </div>
              </div>
          </form>
        )}

      <Modal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        title="Quitter sans enregistrer ?"
        footer={
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="secondary" size="md" className="flex-1 justify-center" onClick={() => setShowCancelConfirm(false)}>
              Continuer l'édition
            </Button>
            <Button variant="danger" size="md" className="flex-1 justify-center" onClick={() => router.push(cancelHref)}>
              Quitter sans enregistrer
            </Button>
          </div>
        }
      >
        <p className="text-sm text-[#454745]">
          Les informations saisies pour cette annonce ne sont pas encore enregistrées. Si vous quittez maintenant, elles seront perdues.
        </p>
      </Modal>
    </div>
  );
}

export default function CreateListingPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto p-12 text-center text-xs font-bold text-[#868685]">
        Chargement...
      </div>
    }>
      <CreateListingContent />
    </Suspense>
  );
}
