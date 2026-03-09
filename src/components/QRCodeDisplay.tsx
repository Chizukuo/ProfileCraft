import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';

interface QRCodeDisplayProps {
    link: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ link }) => {
    const { profileData } = useProfile();
    const { resolvedTheme, themeAppliedVersion } = useTheme();
    const accentColor = profileData?.userSettings.accentColor || '#000';
    const [qrColors, setQrColors] = useState({ dark: "#000000", light: "#ffffff" });

    useEffect(() => {
        const rootStyle = getComputedStyle(document.documentElement);
        const colorDark = rootStyle.getPropertyValue('--qr-code-fg-color').trim() || 
                          rootStyle.getPropertyValue('--theme-text-strong').trim() || 
                          "#000000";
        const colorLight = rootStyle.getPropertyValue('--theme-bg-page').trim() || "#ffffff";

        setQrColors((prev) => {
            if (prev.dark === colorDark && prev.light === colorLight) {
                return prev;
            }

            return { dark: colorDark, light: colorLight };
        });
    }, [themeAppliedVersion, profileData?.userSettings.accentColor]);

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