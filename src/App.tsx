import React, { useState, useEffect } from 'react';
import { useAppStore } from './services/store';
import { Sidebar, NavTab } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { DashboardView } from './views/DashboardView';
import { ClientsView } from './views/ClientsView';
import { PixKeysView } from './views/PixKeysView';
import { PaymentLinksView } from './views/PaymentLinksView';
import { QrGeneratorView } from './views/QrGeneratorView';
import { CustomizationView } from './views/CustomizationView';
import { NfcTagsView } from './views/NfcTagsView';
import { PlansView } from './views/PlansView';
import { SettingsView } from './views/SettingsView';
import { PublicPaymentPage } from './views/PublicPaymentPage';
import { AuthView } from './views/AuthView';
import { NfcTapModal } from './components/NfcTapModal';
import { PaymentLink, NFCTag } from './types';

export default function App() {
  const {
    isLoggedIn,
    currentUser,
    firebaseUser,
    isFirebaseConnected,
    loginWithEmail,
    registerWithEmail,
    logout,
    recoverPassword,
    loginWithGoogle,
    establishments,
    allEstablishments,
    selectedEstablishmentId,
    setSelectedEstablishmentId,
    activeEstablishment,
    pixKeys,
    paymentLinks,
    nfcTags,
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
  } = useAppStore();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedLinkForQr, setSelectedLinkForQr] = useState<PaymentLink | null>(null);

  // Modal / Public Page states
  const [isNfcModalOpen, setIsNfcModalOpen] = useState(false);
  const [publicViewSlug, setPublicViewSlug] = useState<string | null>(null);

  // Check URL pathname for direct public link /p/:slug or /nfc/:tagCode or /:slug
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/p/')) {
      const slug = path.replace('/p/', '').split('/')[0];
      if (slug) setPublicViewSlug(slug);
    } else if (path.startsWith('/nfc/')) {
      const tagCode = path.replace('/nfc/', '').split('/')[0];
      const foundTag = nfcTags.find(t => t.tag_code.toUpperCase() === tagCode.toUpperCase());
      if (foundTag) {
        recordNFCTap(foundTag.id);
        const link = paymentLinks.find(l => l.id === foundTag.payment_link_id);
        const est = establishments.find(e => e.id === foundTag.establishment_id);
        setPublicViewSlug(link?.slug || est?.slug || 'farmacia-do-carro');
      }
    } else if (path.length > 1 && !path.includes('.')) {
      // Direct path: e.g. /farmacia-do-carro ou /barbearia-premium
      const potentialSlug = path.slice(1).split('/')[0].toLowerCase().trim();
      const internalRoutes = ['dashboard', 'clients', 'pix-keys', 'payment-links', 'qr-generator', 'customization', 'nfc-tags', 'plans', 'settings', 'api'];
      if (!internalRoutes.includes(potentialSlug)) {
        const matchesLink = paymentLinks.some(l => l.slug.toLowerCase() === potentialSlug);
        const matchesEst = establishments.some(e => e.slug.toLowerCase() === potentialSlug);
        if (matchesLink || matchesEst) {
          setPublicViewSlug(potentialSlug);
        }
      }
    }
  }, [nfcTags, paymentLinks, establishments]);

  // Tab Titles map
  const tabTitles: Record<NavTab, string> = {
    'dashboard': 'Dashboard',
    'clients': 'Meus Clientes',
    'pix-keys': 'Chaves Pix',
    'payment-links': 'Links de Pagamento',
    'qr-generator': 'Gerador de QR Code',
    'customization': 'Personalização',
    'nfc-tags': 'Plaquinhas NFC',
    'plans': 'Planos e Assinaturas',
    'settings': 'Configurações'
  };

  const handleOpenQrForLink = (link: PaymentLink) => {
    setSelectedLinkForQr(link);
    setCurrentTab('qr-generator');
  };

  const handleSimulateTapFromCard = (tag: NFCTag) => {
    setIsNfcModalOpen(true);
  };

  const handleNfcTapConfirmed = (tagId: string, slug: string) => {
    recordNFCTap(tagId);
    setIsNfcModalOpen(false);
    setPublicViewSlug(slug);
  };

  // If viewing public checkout page
  if (publicViewSlug) {
    const cleanSlug = publicViewSlug.toLowerCase().trim();
    let link = paymentLinks.find(l => l.slug.toLowerCase() === cleanSlug);
    let est = establishments.find(e => e.slug.toLowerCase() === cleanSlug);

    if (link && !est) {
      est = establishments.find(e => e.id === link!.establishment_id);
    } else if (est && !link) {
      link = paymentLinks.find(l => l.establishment_id === est!.id && l.is_active);
    }

    const key = pixKeys.find(
      k => k.id === (link?.pix_key_id || est?.primary_pix_key_id) && k.is_active
    ) || pixKeys.find(k => k.establishment_id === est?.id && k.is_active);

    return (
      <PublicPaymentPage
        slug={publicViewSlug}
        establishment={est}
        paymentLink={link}
        pixKey={key}
        onBackToAdmin={() => setPublicViewSlug(null)}
      />
    );
  }

  // If not logged in, show Auth View (Login / Register / Recover)
  if (!isLoggedIn) {
    return (
      <AuthView
        onLogin={loginWithEmail}
        onRegister={registerWithEmail}
        onRecoverPassword={recoverPassword}
        onLoginGoogle={loginWithGoogle}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#182235] flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={tab => {
          if (tab !== 'qr-generator') setSelectedLinkForQr(null);
          setCurrentTab(tab);
        }}
        currentUser={currentUser}
        establishments={establishments}
        selectedEstablishmentId={selectedEstablishmentId}
        onSelectEstablishment={setSelectedEstablishmentId}
        onToggleRole={toggleUserRole}
        onLogout={logout}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Viewport Container */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen">
        {/* Top Bar Contract */}
        <TopNav
          currentTabName={tabTitles[currentTab]}
          establishment={activeEstablishment}
          currentUser={currentUser}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenPublicPreview={() => setPublicViewSlug(activeEstablishment?.slug || 'farmacia-do-carro')}
          onSimulateNfcTap={() => setIsNfcModalOpen(true)}
          onLogout={logout}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              establishments={establishments}
              pixKeys={pixKeys}
              paymentLinks={paymentLinks}
              nfcTags={nfcTags}
              activeEstablishment={activeEstablishment}
              onNavigateTab={setCurrentTab}
              onOpenPublicPage={setPublicViewSlug}
            />
          )}

          {currentTab === 'clients' && (
            <ClientsView
              establishments={establishments}
              currentUser={currentUser}
              onAddEstablishment={addEstablishment}
              onUpdateEstablishment={updateEstablishment}
              onDeleteEstablishment={deleteEstablishment}
              onOpenPublicPage={setPublicViewSlug}
            />
          )}

          {currentTab === 'pix-keys' && (
            <PixKeysView
              pixKeys={pixKeys}
              establishments={establishments}
              paymentLinks={paymentLinks}
              onAddPixKey={addPixKey}
              onUpdatePixKey={updatePixKey}
              onDeletePixKey={deletePixKey}
            />
          )}

          {currentTab === 'payment-links' && (
            <PaymentLinksView
              paymentLinks={paymentLinks}
              establishments={establishments}
              pixKeys={pixKeys}
              onAddPaymentLink={addPaymentLink}
              onUpdatePaymentLink={updatePaymentLink}
              onDeletePaymentLink={deletePaymentLink}
              onOpenPublicPage={setPublicViewSlug}
              onOpenQrGeneratorForLink={handleOpenQrForLink}
            />
          )}

          {currentTab === 'qr-generator' && (
            <QrGeneratorView
              establishments={establishments}
              pixKeys={pixKeys}
              initialLink={selectedLinkForQr}
              onOpenPublicPage={setPublicViewSlug}
            />
          )}

          {currentTab === 'customization' && (
            <CustomizationView
              establishment={activeEstablishment}
              onUpdateEstablishment={updateEstablishment}
              onOpenPublicPage={setPublicViewSlug}
            />
          )}

          {currentTab === 'nfc-tags' && (
            <NfcTagsView
              nfcTags={nfcTags}
              establishments={establishments}
              paymentLinks={paymentLinks}
              onAddNFCTag={addNFCTag}
              onUpdateNFCTag={updateNFCTag}
              onDeleteNFCTag={deleteNFCTag}
              onSimulateTap={handleSimulateTapFromCard}
            />
          )}

          {currentTab === 'plans' && (
            <PlansView
              currentPlanTier={currentUser.plan_tier}
              onChangePlan={changePlan}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              currentUser={currentUser}
              firebaseUser={firebaseUser}
              isFirebaseConnected={isFirebaseConnected}
              establishments={establishments}
              pixKeys={pixKeys}
              paymentLinks={paymentLinks}
              onUpdateEstablishment={updateEstablishment}
              onVerifyAndSaveDomain={verifyAndSaveCustomDomain}
              onOpenPublicPage={setPublicViewSlug}
              onLoginGoogle={loginWithGoogle}
              onLogoutGoogle={logout}
              onToggleRole={toggleUserRole}
              onResetToDemo={resetToDemo}
            />
          )}
        </main>
      </div>

      {/* NFC Tap Simulation Modal */}
      <NfcTapModal
        isOpen={isNfcModalOpen}
        onClose={() => setIsNfcModalOpen(false)}
        nfcTags={nfcTags}
        establishments={establishments}
        paymentLinks={paymentLinks}
        onTapConfirmed={handleNfcTapConfirmed}
      />
    </div>
  );
}
