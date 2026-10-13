import { useState, useEffect } from 'react';
import {
  Establishment,
  PixKey,
  PaymentLink,
  NFCTag,
  UserProfile,
  PlanTier,
  PlanDefinition,
  UserRole
} from '../types';
import {
  db,
  auth,
  googleProvider,
  testFirestoreConnection,
  handleFirestoreError,
  OperationType
} from './firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDoc
} from 'firebase/firestore';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  User
} from 'firebase/auth';

export const PLANS: PlanDefinition[] = [
  {
    id: 'gratuito',
    name: 'Gratuito',
    price_monthly: 0,
    target_audience: 'Para autônomos e pequenos testes',
    max_links: 3,
    max_establishments: 1,
    custom_branding: false,
    nfc_management: false,
    advanced_analytics: false,
    features: [
      'Até 3 links de pagamento Pix',
      'QR Code Pix padrão BR Code',
      'Página de pagamento padrão',
      'Chaves CPF, CNPJ, Celular, E-mail',
      'Valor livre ou fixo'
    ]
  },
  {
    id: 'essencial',
    name: 'Essencial',
    price_monthly: 29,
    target_audience: 'Para pequenos negócios e comércio de bairro',
    max_links: 20,
    max_establishments: 1,
    custom_branding: true,
    nfc_management: false,
    advanced_analytics: true,
    features: [
      'Até 20 links de pagamento',
      'Personalização básica de cores',
      'Estatísticas de acessos por período',
      'Logotipo no checkout',
      'Suporte via e-mail'
    ]
  },
  {
    id: 'profissional',
    name: 'Profissional',
    price_monthly: 59,
    target_audience: 'Ideal para lojas físicas e plaquinhas NFC no balcão',
    max_links: -1,
    max_establishments: 3,
    custom_branding: true,
    nfc_management: true,
    advanced_analytics: true,
    features: [
      'Links de pagamento ilimitados',
      'Gestão completa de Plaquinhas NFC',
      'Redirecionamento dinâmico sem regravar tag',
      'Personalização avançada (logo, cores, fundo)',
      'Relatórios de acessos e toques NFC',
      'Até 3 estabelecimentos'
    ]
  },
  {
    id: 'empresarial',
    name: 'Empresarial',
    price_monthly: 129,
    target_audience: 'Para redes, franquias e alta demanda comercial',
    max_links: -1,
    max_establishments: 10,
    custom_branding: true,
    nfc_management: true,
    advanced_analytics: true,
    features: [
      'Tudo do Profissional',
      'Múltiplos estabelecimentos (até 10)',
      'Painel master de administração',
      'API para integração de plaquinhas',
      'Suporte prioritário via WhatsApp',
      'Consultoria para gravação em lote'
    ]
  }
];

const STORAGE_KEY_PREFIX = 'meu_pix_nfc_';

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, JSON.stringify(value));
  } catch (err) {
    console.warn('Falha ao salvar no localStorage', err);
  }
}

interface StoredAccount {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  plan_tier: PlanTier;
  establishment_id?: string;
  created_at: string;
}

const initialAccounts: StoredAccount[] = [
  {
    id: 'usr-admin-1',
    email: 'admin@meupixnfc.com.br',
    password: 'admin123',
    name: 'Administrador Geral',
    role: 'admin',
    plan_tier: 'empresarial',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString()
  },
  {
    id: 'usr-client-1',
    email: 'carlos@farmaciadocarro.com.br',
    password: 'cliente123',
    name: 'Carlos Alberto (Farmácia do Carro)',
    role: 'merchant',
    plan_tier: 'profissional',
    establishment_id: 'est-1',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString()
  }
];

// Initial demo seeds
const initialEstablishments: Establishment[] = [
  {
    id: 'est-1',
    user_id: 'usr-client-1',
    name: 'Farmácia do Carro',
    owner_name: 'Carlos Alberto Silva',
    document: '12.345.678/0001-90',
    document_type: 'cnpj',
    phone: '(11) 98765-4321',
    whatsapp: '(11) 98765-4321',
    email: 'carlos@farmaciadocarro.com.br',
    logo_url: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=150&auto=format&fit=crop&q=80',
    primary_pix_key_id: 'key-1',
    city: 'SAO PAULO',
    address: 'Av. Paulista, 1500 - Bela Vista',
    slug: 'farmacia-do-carro',
    primary_color: '#00B8A9',
    secondary_color: '#7137E8',
    welcome_message: 'Pague seu medicamento ou delivery com Pix na hora!',
    custom_domain: 'www.farmaciadocarro.com.br',
    custom_domain_status: 'active',
    custom_domain_ssl: true,
    custom_domain_verified_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'est-2',
    user_id: 'usr-admin-1',
    name: 'Barbearia Premium',
    owner_name: 'Felipe Santos',
    document: '98.765.432/0001-11',
    document_type: 'cnpj',
    phone: '(11) 97123-4567',
    whatsapp: '(11) 97123-4567',
    email: 'atendimento@barbeariapremium.com.br',
    logo_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=150&auto=format&fit=crop&q=80',
    primary_pix_key_id: 'key-2',
    city: 'CAMPINAS',
    address: 'Rua das Camélias, 420 - Cambuí',
    slug: 'barbearia-premium',
    primary_color: '#7137E8',
    secondary_color: '#00B8A9',
    welcome_message: 'Corte, barba e estilo. Aproxime e pague via Pix.',
    custom_domain: 'www.barbeariapremium.com.br',
    custom_domain_status: 'active',
    custom_domain_ssl: true,
    custom_domain_verified_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'est-3',
    user_id: 'usr-admin-1',
    name: 'Mercado Central',
    owner_name: 'Mariana Duarte',
    document: '33.444.555/0001-66',
    document_type: 'cnpj',
    phone: '(21) 99887-6655',
    whatsapp: '(21) 99887-6655',
    email: 'financeiro@mercadocentral.com',
    logo_url: '',
    primary_pix_key_id: 'key-3',
    city: 'RIO DE JANEIRO',
    address: 'Praça XV de Novembro, 88 - Centro',
    slug: 'mercado-central',
    primary_color: '#00B8A9',
    secondary_color: '#182235',
    welcome_message: 'Caixa Rápido Meu Pix NFC - Economize tempo.',
    custom_domain: 'pix.mercadocentral.com',
    custom_domain_status: 'pending',
    custom_domain_ssl: false,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

const initialPixKeys: PixKey[] = [
  {
    id: 'key-1',
    establishment_id: 'est-1',
    key_type: 'cnpj',
    key_value: '12345678000190',
    label: 'CNPJ Principal - Santander',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: 'key-2',
    establishment_id: 'est-2',
    key_type: 'phone',
    key_value: '+5511971234567',
    label: 'Celular - NuBank PJ',
    is_active: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString()
  },
  {
    id: 'key-3',
    establishment_id: 'est-3',
    key_type: 'email',
    key_value: 'pix@mercadocentral.com',
    label: 'E-mail Financeiro - Itaú',
    is_active: true,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString()
  }
];

const initialPaymentLinks: PaymentLink[] = [
  {
    id: 'link-1',
    establishment_id: 'est-1',
    pix_key_id: 'key-1',
    slug: 'farmacia-do-carro',
    title: 'Balcão Principal - Farmácia do Carro',
    description: 'Pague qualquer valor diretamente no caixa',
    amount: null,
    is_active: true,
    visits_count: 247,
    txid: 'FARMA01',
    created_at: new Date(Date.now() - 28 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'link-2',
    establishment_id: 'est-2',
    pix_key_id: 'key-2',
    slug: 'barbearia-premium',
    title: 'Corte Tradicional + Barba',
    description: 'Combo cabelo e barba completo',
    amount: 85.00,
    is_active: true,
    visits_count: 142,
    txid: 'BARBER85',
    created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'link-3',
    establishment_id: 'est-3',
    pix_key_id: 'key-3',
    slug: 'mercado-central',
    title: 'Caixa Expresso Hortifruti',
    description: 'Pagamento rápido sem filas',
    amount: null,
    is_active: true,
    visits_count: 512,
    txid: 'MCENTRAL',
    created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

const initialNFCTags: NFCTag[] = [
  {
    id: 'nfc-1',
    tag_code: 'NFC-FARMA-01',
    establishment_id: 'est-1',
    payment_link_id: 'link-1',
    label: 'Totem de Entrada / Caixa 1',
    status: 'active',
    taps_count: 184,
    last_tap_at: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'nfc-2',
    tag_code: 'NFC-BARBER-01',
    establishment_id: 'est-2',
    payment_link_id: 'link-2',
    label: 'Espelho Cadeira 1',
    status: 'active',
    taps_count: 98,
    last_tap_at: new Date(Date.now() - 7200000).toISOString(),
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'nfc-3',
    tag_code: 'NFC-MERCADO-01',
    establishment_id: 'est-3',
    payment_link_id: 'link-3',
    label: 'Plaquinha Balcão Hortifruti',
    status: 'active',
    taps_count: 382,
    last_tap_at: new Date(Date.now() - 1800000).toISOString(),
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

export function useAppStore() {
  const [accounts, setAccounts] = useState<StoredAccount[]>(() =>
    getStored('accounts', initialAccounts)
  );

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() =>
    getStored('is_logged_in', true)
  );

  const [currentUser, setCurrentUser] = useState<UserProfile>(() =>
    getStored('user', {
      id: initialAccounts[0].id,
      email: initialAccounts[0].email,
      name: initialAccounts[0].name,
      role: initialAccounts[0].role,
      plan_tier: initialAccounts[0].plan_tier,
      created_at: initialAccounts[0].created_at
    })
  );

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);

  const [establishments, setEstablishments] = useState<Establishment[]>(() =>
    getStored('establishments', initialEstablishments)
  );

  const [pixKeys, setPixKeys] = useState<PixKey[]>(() =>
    getStored('pix_keys', initialPixKeys)
  );

  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>(() =>
    getStored('payment_links', initialPaymentLinks)
  );

  const [nfcTags, setNfcTags] = useState<NFCTag[]>(() =>
    getStored('nfc_tags', initialNFCTags)
  );

  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState<string>(() => {
    const list = getStored('establishments', initialEstablishments);
    return list.length > 0 ? list[0].id : '';
  });

  // Test Firestore connection on mount
  useEffect(() => {
    testFirestoreConnection().then(connected => {
      setIsFirebaseConnected(connected);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, user => {
      setFirebaseUser(user);
    });

    return () => unsubscribeAuth();
  }, []);

  // Listen to Firestore Realtime Updates when available
  useEffect(() => {
    let hadEstDocs = false;
    let hadKeyDocs = false;
    let hadLinkDocs = false;
    let hadTagDocs = false;

    try {
      const unsubEst = onSnapshot(
        collection(db, 'establishments'),
        snapshot => {
          if (!snapshot.empty) {
            hadEstDocs = true;
            const list = snapshot.docs.map(doc => doc.data() as Establishment);
            setEstablishments(list);
          } else if (hadEstDocs) {
            setEstablishments([]);
          }
        },
        error => {
          console.warn('Firestore establishments listener offline/fallback:', error.message);
        }
      );

      const unsubKeys = onSnapshot(
        collection(db, 'pix_keys'),
        snapshot => {
          if (!snapshot.empty) {
            hadKeyDocs = true;
            const list = snapshot.docs.map(doc => doc.data() as PixKey);
            setPixKeys(list);
          } else if (hadKeyDocs) {
            setPixKeys([]);
          }
        },
        error => {
          console.warn('Firestore pix_keys listener offline/fallback:', error.message);
        }
      );

      const unsubLinks = onSnapshot(
        collection(db, 'payment_links'),
        snapshot => {
          if (!snapshot.empty) {
            hadLinkDocs = true;
            const list = snapshot.docs.map(doc => doc.data() as PaymentLink);
            setPaymentLinks(list);
          } else if (hadLinkDocs) {
            setPaymentLinks([]);
          }
        },
        error => {
          console.warn('Firestore payment_links listener offline/fallback:', error.message);
        }
      );

      const unsubTags = onSnapshot(
        collection(db, 'nfc_tags'),
        snapshot => {
          if (!snapshot.empty) {
            hadTagDocs = true;
            const list = snapshot.docs.map(doc => doc.data() as NFCTag);
            setNfcTags(list);
          } else if (hadTagDocs) {
            setNfcTags([]);
          }
        },
        error => {
          console.warn('Firestore nfc_tags listener offline/fallback:', error.message);
        }
      );

      return () => {
        unsubEst();
        unsubKeys();
        unsubLinks();
        unsubTags();
      };
    } catch (e) {
      console.warn('Firestore onSnapshot init fallback:', e);
    }
  }, []);

  // Sync to local storage
  useEffect(() => {
    setStored('accounts', accounts);
  }, [accounts]);

  useEffect(() => {
    setStored('is_logged_in', isLoggedIn);
  }, [isLoggedIn]);

  useEffect(() => {
    setStored('user', currentUser);
  }, [currentUser]);

  useEffect(() => {
    setStored('establishments', establishments);
  }, [establishments]);

  useEffect(() => {
    setStored('pix_keys', pixKeys);
  }, [pixKeys]);

  useEffect(() => {
    setStored('payment_links', paymentLinks);
  }, [paymentLinks]);

  useEffect(() => {
    setStored('nfc_tags', nfcTags);
  }, [nfcTags]);

  // Adjust selected establishment if current user is merchant
  useEffect(() => {
    if (currentUser.role === 'merchant') {
      const userEst = establishments.find(
        e => e.user_id === currentUser.id || e.id === currentUser.establishment_id
      ) || establishments[0];
      if (userEst && userEst.id !== selectedEstablishmentId) {
        setSelectedEstablishmentId(userEst.id);
      }
    }
  }, [currentUser, establishments]);

  // FILTERED SCOPES FOR CLIENT (MERCHANT) VS ADMIN
  const visibleEstablishments =
    currentUser.role === 'admin'
      ? establishments
      : establishments.filter(
          e => e.user_id === currentUser.id || e.id === currentUser.establishment_id
        );

  const activeEstablishment: Establishment | null =
    visibleEstablishments.find(e => e.id === selectedEstablishmentId) ||
    visibleEstablishments[0] ||
    establishments[0] ||
    null;

  const visiblePixKeys =
    currentUser.role === 'admin'
      ? pixKeys
      : pixKeys.filter(k => k.establishment_id === activeEstablishment?.id);

  const visiblePaymentLinks =
    currentUser.role === 'admin'
      ? paymentLinks
      : paymentLinks.filter(l => l.establishment_id === activeEstablishment?.id);

  const visibleNfcTags =
    currentUser.role === 'admin'
      ? nfcTags
      : nfcTags.filter(t => t.establishment_id === activeEstablishment?.id);

  // AUTH ACTIONS
  const loginWithEmail = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    // 1. Try Firebase Auth
    try {
      const userCred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
      if (userCred.user) {
        // Look up profile in Firestore
        let userProfile: UserProfile | null = null;
        try {
          const docSnap = await getDoc(doc(db, 'profiles', userCred.user.uid));
          if (docSnap.exists()) {
            userProfile = docSnap.data() as UserProfile;
          }
        } catch (e) {
          console.warn('Profile read in firestore:', e);
        }

        const role: UserRole = userProfile?.role || (cleanEmail.includes('admin') ? 'admin' : 'merchant');
        const userObj: UserProfile = {
          id: userCred.user.uid,
          email: userCred.user.email || cleanEmail,
          name: userCred.user.displayName || userProfile?.name || cleanEmail.split('@')[0],
          role,
          plan_tier: userProfile?.plan_tier || 'profissional',
          created_at: new Date().toISOString()
        };

        setCurrentUser(userObj);
        setIsLoggedIn(true);
        return { success: true };
      }
    } catch (fbErr: any) {
      // If Firebase Auth returns error, check local registered accounts
      console.warn('Firebase Auth try failed, checking local accounts store:', fbErr?.code || fbErr?.message);
    }

    // 2. Check local registered accounts
    const match = accounts.find(
      acc => acc.email.toLowerCase() === cleanEmail && acc.password === cleanPass
    );

    if (match) {
      const userObj: UserProfile = {
        id: match.id,
        email: match.email,
        name: match.name,
        role: match.role,
        plan_tier: match.plan_tier,
        establishment_id: match.establishment_id,
        created_at: match.created_at
      };
      setCurrentUser(userObj);
      setIsLoggedIn(true);
      return { success: true };
    }

    return {
      success: false,
      error: 'E-mail ou senha incorretos. Verifique suas credenciais ou use uma conta de teste.'
    };
  };

  const registerWithEmail = async ({
    name,
    email,
    password,
    role,
    establishmentName
  }: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    establishmentName?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass || !cleanName) {
      return { success: false, error: 'Preencha todos os campos obrigatórios.' };
    }

    if (cleanPass.length < 6) {
      return { success: false, error: 'A senha deve ter pelo menos 6 caracteres.' };
    }

    // Check duplicate
    const exists = accounts.some(acc => acc.email.toLowerCase() === cleanEmail);
    if (exists) {
      return { success: false, error: 'Este e-mail já está cadastrado na plataforma.' };
    }

    let uid = `usr-${Date.now()}`;

    // Try creating in Firebase Auth
    try {
      const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
      if (userCred.user) {
        uid = userCred.user.uid;
        await updateProfile(userCred.user, { displayName: cleanName });
      }
    } catch (err: any) {
      console.warn('Firebase createUser fallback:', err?.code || err?.message);
    }

    let estId: string | undefined = undefined;

    // If client/merchant, create an establishment for them!
    if (role === 'merchant') {
      estId = `est-${Date.now()}`;
      const storeName = establishmentName?.trim() || `Loja de ${cleanName.split(' ')[0]}`;
      const slug = storeName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9 ]/g, '')
        .trim()
        .replace(/\s+/g, '-');

      const initialKeyId = `key-${Date.now()}`;
      const newKey: PixKey = {
        id: initialKeyId,
        establishment_id: estId,
        key_type: 'random',
        key_value: '123e4567-e89b-12d3-a456-426614174000',
        label: 'Chave Principal Loja',
        is_active: true,
        created_at: new Date().toISOString()
      };

      const newEst: Establishment = {
        id: estId,
        user_id: uid,
        name: storeName,
        owner_name: cleanName,
        document: '12.345.678/0001-00',
        document_type: 'cnpj',
        phone: '(11) 98888-7777',
        whatsapp: '(11) 98888-7777',
        email: cleanEmail,
        logo_url: '',
        primary_pix_key_id: initialKeyId,
        city: 'SAO PAULO',
        address: 'Rua Comercial, 100',
        slug,
        primary_color: '#00B8A9',
        secondary_color: '#7137E8',
        welcome_message: 'Aproxime seu celular e pague via Pix!',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const newLink: PaymentLink = {
        id: `link-${Date.now()}`,
        establishment_id: estId,
        pix_key_id: initialKeyId,
        slug,
        title: `Pagamento Balcão — ${storeName}`,
        description: 'Aproxime o celular na plaquinha NFC',
        amount: null,
        is_active: true,
        visits_count: 0,
        txid: '***',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const newTag: NFCTag = {
        id: `nfc-${Date.now()}`,
        tag_code: `NFC-${Math.floor(1000 + Math.random() * 9000)}`,
        establishment_id: estId,
        payment_link_id: newLink.id,
        label: 'Plaquinha Balcão Principal',
        status: 'active',
        taps_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setEstablishments(prev => [newEst, ...prev]);
      setPixKeys(prev => [newKey, ...prev]);
      setPaymentLinks(prev => [newLink, ...prev]);
      setNfcTags(prev => [newTag, ...prev]);
      setSelectedEstablishmentId(estId);

      // Save to Firestore
      try {
        await setDoc(doc(db, 'establishments', estId), newEst);
        await setDoc(doc(db, 'pix_keys', initialKeyId), newKey);
        await setDoc(doc(db, 'payment_links', newLink.id), newLink);
        await setDoc(doc(db, 'nfc_tags', newTag.id), newTag);
      } catch (e) {
        console.warn('Firestore store create:', e);
      }
    }

    const newAccount: StoredAccount = {
      id: uid,
      email: cleanEmail,
      password: cleanPass,
      name: cleanName,
      role,
      plan_tier: role === 'admin' ? 'empresarial' : 'profissional',
      establishment_id: estId,
      created_at: new Date().toISOString()
    };

    setAccounts(prev => [newAccount, ...prev]);

    const newUserObj: UserProfile = {
      id: uid,
      email: cleanEmail,
      name: cleanName,
      role,
      plan_tier: newAccount.plan_tier,
      establishment_id: estId,
      created_at: newAccount.created_at
    };

    // Save profile to Firestore
    try {
      await setDoc(doc(db, 'profiles', uid), newUserObj);
    } catch (e) {
      console.warn('Firestore profile create:', e);
    }

    setCurrentUser(newUserObj);
    setIsLoggedIn(true);

    return { success: true };
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase signout:', e);
    }
    setFirebaseUser(null);
    setIsLoggedIn(false);
  };

  const recoverPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return {
        success: true,
        message: 'Instruções de redefinição de senha enviadas para o seu e-mail.'
      };
    } catch (e) {
      return {
        success: true,
        message: 'Se este e-mail estiver cadastrado, o link de recuperação foi enviado com sucesso.'
      };
    }
  };

  // Google Login via Firebase
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const userObj: UserProfile = {
          id: result.user.uid,
          email: result.user.email || 'usuario@google.com',
          name: result.user.displayName || 'Usuário Google',
          role: 'admin',
          plan_tier: 'profissional',
          avatar_url: result.user.photoURL || undefined,
          created_at: new Date().toISOString()
        };
        setCurrentUser(userObj);
        setIsLoggedIn(true);
        return result.user;
      }
    } catch (err: any) {
      console.error('Erro no login Google Firebase:', err);
      throw err;
    }
  };

  // Ações de Estabelecimentos
  const addEstablishment = async (data: Omit<Establishment, 'id' | 'created_at' | 'updated_at'> & { initial_pix_key?: string; initial_key_type?: any }) => {
    const id = `est-${Date.now()}`;
    const now = new Date().toISOString();
    let keyId: string | undefined = undefined;

    if (data.initial_pix_key && data.initial_key_type) {
      keyId = `key-${Date.now()}`;
      const newKey: PixKey = {
        id: keyId,
        establishment_id: id,
        key_type: data.initial_key_type,
        key_value: data.initial_pix_key,
        label: 'Chave Principal',
        is_active: true,
        created_at: now
      };
      setPixKeys(prev => [newKey, ...prev]);
      try {
        await setDoc(doc(db, 'pix_keys', keyId), newKey);
      } catch (err) {
        console.warn('Sync pix_key to firestore:', err);
      }
    }

    const newEst: Establishment = {
      ...data,
      id,
      user_id: currentUser.id,
      primary_pix_key_id: keyId,
      created_at: now,
      updated_at: now
    };

    setEstablishments(prev => [newEst, ...prev]);

    try {
      await setDoc(doc(db, 'establishments', id), newEst);
    } catch (err) {
      console.warn('Sync establishment to firestore:', err);
    }

    if (keyId) {
      const newLink: PaymentLink = {
        id: `link-${Date.now()}`,
        establishment_id: id,
        pix_key_id: keyId,
        slug: newEst.slug,
        title: `Pagamento Pix — ${newEst.name}`,
        description: 'Aproxime sua plaquinha NFC ou escaneie o QR Code',
        amount: null,
        is_active: true,
        visits_count: 0,
        txid: '***',
        created_at: now,
        updated_at: now
      };
      setPaymentLinks(prev => [newLink, ...prev]);
      try {
        await setDoc(doc(db, 'payment_links', newLink.id), newLink);
      } catch (err) {
        console.warn('Sync payment_link to firestore:', err);
      }
    }

    setSelectedEstablishmentId(id);
    return newEst;
  };

  const updateEstablishment = async (id: string, updates: Partial<Establishment>) => {
    const updated = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    setEstablishments(prev =>
      prev.map(e => (e.id === id ? { ...e, ...updated } : e))
    );
    try {
      await setDoc(doc(db, 'establishments', id), updated, { merge: true });
    } catch (err) {
      console.warn('Update establishment in firestore:', err);
    }
  };

  const verifyAndSaveCustomDomain = async (
    establishmentId: string,
    rawDomain: string
  ): Promise<{ success: boolean; domain?: string; error?: string }> => {
    const clean = rawDomain.trim().toLowerCase().replace(/^https?:\/\//i, '').split('/')[0].split('?')[0];
    
    // Se vazio, remove o domínio personalizado
    if (!clean) {
      await updateEstablishment(establishmentId, {
        custom_domain: '',
        custom_domain_status: undefined,
        custom_domain_ssl: undefined,
        custom_domain_verified_at: undefined
      });
      return { success: true, domain: '' };
    }

    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;
    if (!domainRegex.test(clean)) {
      return { success: false, error: 'Formato inválido. Use um formato como www.dominio.com ou pix.empresa.com.br' };
    }

    const duplicate = establishments.find(
      e => e.id !== establishmentId && e.custom_domain?.toLowerCase() === clean
    );
    if (duplicate) {
      return {
        success: false,
        error: `Este domínio já está registrado para o estabelecimento "${duplicate.name}".`
      };
    }

    const now = new Date().toISOString();
    await updateEstablishment(establishmentId, {
      custom_domain: clean,
      custom_domain_status: 'active',
      custom_domain_ssl: true,
      custom_domain_verified_at: now
    });

    try {
      await fetch('/api/domains/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: clean, establishment_id: establishmentId })
      });
    } catch (e) {
      // offline / mock sync
    }

    return { success: true, domain: clean };
  };

  const deleteEstablishment = async (id: string) => {
    // 1. Update establishments and active ID synchronously
    setEstablishments(prev => {
      const remaining = prev.filter(e => e.id !== id);
      if (selectedEstablishmentId === id) {
        setSelectedEstablishmentId(remaining.length > 0 ? remaining[0].id : '');
      }
      return remaining;
    });

    // 2. Remove associated items from state
    setPixKeys(prev => prev.filter(k => k.establishment_id !== id));
    setPaymentLinks(prev => prev.filter(l => l.establishment_id !== id));
    setNfcTags(prev => prev.filter(t => t.establishment_id !== id));

    // 3. Delete from Firestore
    try {
      await deleteDoc(doc(db, 'establishments', id));

      const keysToRemove = pixKeys.filter(k => k.establishment_id === id);
      for (const k of keysToRemove) {
        await deleteDoc(doc(db, 'pix_keys', k.id)).catch(() => {});
      }

      const linksToRemove = paymentLinks.filter(l => l.establishment_id === id);
      for (const l of linksToRemove) {
        await deleteDoc(doc(db, 'payment_links', l.id)).catch(() => {});
      }

      const tagsToRemove = nfcTags.filter(t => t.establishment_id === id);
      for (const t of tagsToRemove) {
        await deleteDoc(doc(db, 'nfc_tags', t.id)).catch(() => {});
      }
    } catch (err) {
      console.warn('Delete establishment from firestore:', err);
    }
  };

  // Ações de Chaves Pix
  const addPixKey = async (data: Omit<PixKey, 'id' | 'created_at'>) => {
    const newKey: PixKey = {
      ...data,
      id: `key-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setPixKeys(prev => [newKey, ...prev]);
    try {
      await setDoc(doc(db, 'pix_keys', newKey.id), newKey);
    } catch (err) {
      console.warn('Add pix_key in firestore:', err);
    }
    return newKey;
  };

  const updatePixKey = async (id: string, updates: Partial<PixKey>) => {
    setPixKeys(prev => prev.map(k => (k.id === id ? { ...k, ...updates } : k)));
    try {
      await setDoc(doc(db, 'pix_keys', id), updates, { merge: true });
    } catch (err) {
      console.warn('Update pix_key in firestore:', err);
    }
  };

  const deletePixKey = async (id: string) => {
    setPixKeys(prev => prev.filter(k => k.id !== id));
    try {
      await deleteDoc(doc(db, 'pix_keys', id));
    } catch (err) {
      console.warn('Delete pix_key in firestore:', err);
    }
  };

  // Ações de Links de Pagamento
  const addPaymentLink = async (data: Omit<PaymentLink, 'id' | 'visits_count' | 'created_at' | 'updated_at'>) => {
    const newLink: PaymentLink = {
      ...data,
      id: `link-${Date.now()}`,
      visits_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setPaymentLinks(prev => [newLink, ...prev]);
    try {
      await setDoc(doc(db, 'payment_links', newLink.id), newLink);
    } catch (err) {
      console.warn('Add payment_link in firestore:', err);
    }
    return newLink;
  };

  const updatePaymentLink = async (id: string, updates: Partial<PaymentLink>) => {
    const updated = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    setPaymentLinks(prev =>
      prev.map(l => (l.id === id ? { ...l, ...updated } : l))
    );
    try {
      await setDoc(doc(db, 'payment_links', id), updated, { merge: true });
    } catch (err) {
      console.warn('Update payment_link in firestore:', err);
    }
  };

  const deletePaymentLink = async (id: string) => {
    setPaymentLinks(prev => prev.filter(l => l.id !== id));
    try {
      await deleteDoc(doc(db, 'payment_links', id));
    } catch (err) {
      console.warn('Delete payment_link in firestore:', err);
    }
  };

  // Ações de Plaquinhas NFC
  const addNFCTag = async (data: Omit<NFCTag, 'id' | 'taps_count' | 'created_at' | 'updated_at'>) => {
    const newTag: NFCTag = {
      ...data,
      id: `nfc-${Date.now()}`,
      taps_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setNfcTags(prev => [newTag, ...prev]);
    try {
      await setDoc(doc(db, 'nfc_tags', newTag.id), newTag);
    } catch (err) {
      console.warn('Add nfc_tag in firestore:', err);
    }
    return newTag;
  };

  const updateNFCTag = async (id: string, updates: Partial<NFCTag>) => {
    const updated = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    setNfcTags(prev =>
      prev.map(t => (t.id === id ? { ...t, ...updated } : t))
    );
    try {
      await setDoc(doc(db, 'nfc_tags', id), updated, { merge: true });
    } catch (err) {
      console.warn('Update nfc_tag in firestore:', err);
    }
  };

  const deleteNFCTag = async (id: string) => {
    setNfcTags(prev => prev.filter(t => t.id !== id));
    try {
      await deleteDoc(doc(db, 'nfc_tags', id));
    } catch (err) {
      console.warn('Delete nfc_tag in firestore:', err);
    }
  };

  const recordNFCTap = async (tagId: string) => {
    const now = new Date().toISOString();
    setNfcTags(prev =>
      prev.map(t =>
        t.id === tagId
          ? { ...t, taps_count: t.taps_count + 1, last_tap_at: now, updated_at: now }
          : t
      )
    );
    try {
      const tag = nfcTags.find(t => t.id === tagId);
      if (tag) {
        await setDoc(
          doc(db, 'nfc_tags', tagId),
          { taps_count: tag.taps_count + 1, last_tap_at: now, updated_at: now },
          { merge: true }
        );
      }
    } catch (err) {
      console.warn('Record tap in firestore:', err);
    }
  };

  const toggleUserRole = () => {
    setCurrentUser(prev => ({
      ...prev,
      role: prev.role === 'admin' ? 'merchant' : 'admin'
    }));
  };

  const changePlan = (tier: PlanTier) => {
    setCurrentUser(prev => ({ ...prev, plan_tier: tier }));
  };

  const resetToDemo = async () => {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}establishments`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}pix_keys`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}payment_links`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}nfc_tags`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}user`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}accounts`);
    setAccounts(initialAccounts);
    setEstablishments(initialEstablishments);
    setPixKeys(initialPixKeys);
    setPaymentLinks(initialPaymentLinks);
    setNfcTags(initialNFCTags);
    setCurrentUser({
      id: initialAccounts[0].id,
      email: initialAccounts[0].email,
      name: initialAccounts[0].name,
      role: initialAccounts[0].role,
      plan_tier: initialAccounts[0].plan_tier,
      created_at: initialAccounts[0].created_at
    });
    setSelectedEstablishmentId('est-1');

    try {
      for (const e of initialEstablishments) {
        await setDoc(doc(db, 'establishments', e.id), e);
      }
      for (const k of initialPixKeys) {
        await setDoc(doc(db, 'pix_keys', k.id), k);
      }
      for (const l of initialPaymentLinks) {
        await setDoc(doc(db, 'payment_links', l.id), l);
      }
      for (const t of initialNFCTags) {
        await setDoc(doc(db, 'nfc_tags', t.id), t);
      }
    } catch (err) {
      console.warn('Seed to firestore:', err);
    }
  };

  return {
    isLoggedIn,
    currentUser,
    firebaseUser,
    isFirebaseConnected,
    loginWithEmail,
    registerWithEmail,
    logout,
    recoverPassword,
    loginWithGoogle,
    establishments: visibleEstablishments,
    allEstablishments: establishments,
    selectedEstablishmentId,
    setSelectedEstablishmentId,
    activeEstablishment,
    pixKeys: visiblePixKeys,
    paymentLinks: visiblePaymentLinks,
    nfcTags: visibleNfcTags,
    addEstablishment,
    updateEstablishment,
    verifyAndSaveCustomDomain,
    deleteEstablishment,
    addPixKey,
    updatePixKey,
    deletePixKey,
    addPaymentLink,
    updatePaymentLink,
    deletePaymentLink,
    addNFCTag,
    updateNFCTag,
    deleteNFCTag,
    recordNFCTap,
    toggleUserRole,
    changePlan,
    resetToDemo
  };
}
