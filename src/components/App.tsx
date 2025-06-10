import React, { useEffect, useState } from 'react';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';
import Toolbar from './Toolbar';
import ProfileHeader from './ProfileHeader';
import Card from './Card';
import AddCardModal from './AddCardModal';
import { applyThemeColors } from '../utils/colorUtils';
import EditableText from './ui/EditableText';

const SeoContent: React.FC = () => (
    <div className="intro-section" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', left: '-9999px', top: '-9999px', opacity: 0 }}>
        <h1>芝士扩列条在线制作工具 (ProfileCraft)</h1>
        <p>
            使用 ProfileCraft，您可以方便地在线制作和分享您的个人扩列条。这是一个简洁的工具，帮助您快速生成社交名片。
        </p>
    </div>
);


function App() {
  const { profileData, isLoaded, updateProfileData } = useProfile();
  const { theme, setTheme } = useTheme();
  const [isAddCardModalOpen, setAddCardModalOpen] = useState(false);

  // The update logic is now throttled at the source (Toolbar),
  // so we can apply the theme directly whenever the global state changes.
  // The debounce logic has been removed.
  useEffect(() => {
        const art = `

 ▄████▄   ██░ ██  ██▓▒███████▒ █    ██  ██ ▄█▀ █    ██  ▒█████  
▒██▀ ▀█  ▓██░ ██▒▓██▒▒ ▒ ▒ ▄▀░ ██  ▓██▒ ██▄█▒  ██  ▓██▒▒██▒  ██▒
▒▓█    ▄ ▒██▀▀██░▒██▒░ ▒ ▄▀▒░ ▓██  ▒██░▓███▄░ ▓██  ▒██░▒██░  ██▒
▒▓▓▄ ▄██▒░▓█ ░██ ░██░  ▄▀▒   ░▓▓█  ░██░▓██ █▄ ▓▓█  ░██░▒██   ██░
▒ ▓███▀ ░░▓█▒░██▓░██░▒███████▒▒▒█████▓ ▒██▒ █▄▒▒█████▓ ░ ████▓▒░
░ ░▒ ▒  ░ ▒ ░░▒░▒░▓  ░▒▒ ▓░▒░▒░▒▓▒ ▒ ▒ ▒ ▒▒ ▓▒░▒▓▒ ▒ ▒ ░ ▒░▒░▒░ 
  ░  ▒    ▒ ░▒░ ░ ▒ ░░░▒ ▒ ░ ▒░░▒░ ░ ░ ░ ░▒ ▒░░░▒░ ░ ░   ░ ▒ ▒░ 
░         ░  ░░ ░ ▒ ░░ ░ ░ ░ ░░░ ░ ░ ░ ░░ ░  ░░░ ░ ░ ░ ░ ░ ▒  
░ ░       ░  ░  ░ ░    ░ ░       ░     ░  ░      ░         ░ ░  
░                    ░                                          
    
    
    `;

        const versionInfo = `
        芝士扩列条编辑器 V2.0.0
         chizukuo@icloud.com
    `;

        const styleArt = `
    color: #FFC107;
    font-weight: bold;
    font-size: 14px;
    font-family: "Courier New", "Lucida Console", monospace;
    white-space: pre;
    `;

        const styleVersion = `
    color: #B5651D; 
    font-weight: bold;
    font-size: 12px;
    font-family: "Courier New", "Lucida Console", monospace;
    white-space: pre;
    `;

        console.log('%c' + art, styleArt.trim());
        console.log('%c' + versionInfo, styleVersion.trim());
  }, []); 

  useEffect(() => {
    if (profileData) {
      applyThemeColors(profileData.userSettings.accentColor);
    }
  }, [profileData?.userSettings.accentColor]);

  const handleFooterUpdate = (html: string) => {
    if (profileData) {
        updateProfileData(prev => ({
            ...prev!,
            userSettings: { ...prev!.userSettings, footerText: html }
        }));
    }
  };

  if (!isLoaded || !profileData) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return (
    <>
      <SeoContent />
      <Toolbar onAddCardClick={() => setAddCardModalOpen(true)} />
      <main id="profileCardContainer" className="py-10 px-4 md:px-6 lg:px-8 min-h-screen flex flex-col items-center">
        <ProfileHeader />
        <div className="grid-container">
          {profileData.cards.map((card, index) => (
            <Card key={card.id} cardData={card} cardIndex={index} />
          ))}
        </div>
        <footer className="page-footer">
            <EditableText 
              as="p"
              html={profileData.userSettings.footerText}
              onUpdate={handleFooterUpdate}
            />
        </footer>
      </main>
      <AddCardModal 
        isOpen={isAddCardModalOpen} 
        onClose={() => setAddCardModalOpen(false)} 
      />
    </>
  );
}

export default App;
