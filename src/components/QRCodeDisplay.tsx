import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';

interface QRCodeDisplayProps {
    link: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ link }) => {
    const { profileData } = useProfile();
    const { theme } = useTheme(); // Use the theme context
    const accentColor = profileData?.userSettings.accentColor || '#000';
    const [qrColors, setQrColors] = useState({ dark: "#000000", light: "#ffffff" });

    useEffect(() => {
        // This function now runs whenever the theme or accent color changes.
        // We use a short timeout to allow the browser to apply the new theme's CSS file
        // before we read the computed style values.
        const timer = setTimeout(() => {
            // UPDATED: Read the correct CSS variable for the QR code foreground.
            const colorDark = getComputedStyle(document.documentElement).getPropertyValue('--qr-code-fg-color').trim() || 
                              getComputedStyle(document.documentElement).getPropertyValue('--theme-text-strong').trim() || 
                              "#000000";
            const colorLight = getComputedStyle(document.documentElement).getPropertyValue('--theme-bg-page').trim() || "#ffffff";
            setQrColors({ dark: colorDark, light: colorLight });
        }, 100); // Increased delay slightly to ensure theme CSS is applied

        return () => clearTimeout(timer);

    }, [theme, profileData?.userSettings.accentColor]); // Rerun effect when theme or accent color changes

    return (
        <div className="qr-code-container" style={{borderColor: accentColor}}>
            <QRCodeSVG
                value={link}
                size={128}
                bgColor={qrColors.light}
                fgColor={qrColors.dark}
                level={"H"}
                includeMargin={false}
                // Add a class for potential CSS targeting
                className="qr-code"
            />
        </div>
    );
};

export default QRCodeDisplay;