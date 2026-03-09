import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';

interface QRCodeDisplayProps {
    link: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ link }) => {
    const { profileData } = useProfile();
    const { theme, resolvedTheme } = useTheme();
    const accentColor = profileData?.userSettings.accentColor || '#000';
    const [qrColors, setQrColors] = useState({ dark: "#000000", light: "#ffffff" });

    useEffect(() => {
        let frameId = 0;
        const updateQrColors = () => {
            const colorDark = getComputedStyle(document.documentElement).getPropertyValue('--qr-code-fg-color').trim() || 
                              getComputedStyle(document.documentElement).getPropertyValue('--theme-text-strong').trim() || 
                              "#000000";
            const colorLight = getComputedStyle(document.documentElement).getPropertyValue('--theme-bg-page').trim() || "#ffffff";
            setQrColors({ dark: colorDark, light: colorLight });
        };

        frameId = window.requestAnimationFrame(() => {
            window.requestAnimationFrame(updateQrColors);
        });

        return () => window.cancelAnimationFrame(frameId);

    }, [theme, profileData?.userSettings.accentColor]);

    const qrContainerStyle = resolvedTheme.settings.isAccentColorEnabled
        ? { borderColor: accentColor }
        : undefined;

    return (
        <div className="qr-code-container" style={qrContainerStyle}>
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