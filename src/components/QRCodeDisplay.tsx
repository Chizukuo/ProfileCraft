import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useProfile } from '../context/ProfileContext';

interface QRCodeDisplayProps {
    link: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ link }) => {
    const { profileData } = useProfile();
    const accentColor = profileData?.userSettings.accentColor || '#000';
    const [qrColors, setQrColors] = useState({ dark: "#000000", light: "#ffffff" });

    useEffect(() => {
        if (profileData) {
            // Read computed styles after the DOM has been painted and theme is applied
            const colorDark = getComputedStyle(document.documentElement).getPropertyValue('--theme-text-strong').trim() || "#000000";
            const colorLight = getComputedStyle(document.documentElement).getPropertyValue('--theme-bg-page').trim() || "#ffffff";
            setQrColors({ dark: colorDark, light: colorLight });
        }
    }, [profileData]); // Re-run when profile data (and thus theme) changes

    return (
        <div className="qr-code-container" style={{borderColor: accentColor}}>
            <QRCodeSVG
                value={link}
                size={128}
                bgColor={qrColors.light}
                fgColor={qrColors.dark}
                level={"H"}
                includeMargin={false}
            />
        </div>
    );
};

export default QRCodeDisplay;
