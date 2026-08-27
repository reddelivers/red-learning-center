import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

interface BadgeData {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  verificationUrl?: string;
}

interface BadgeDocumentProps {
  badges: BadgeData[];
  issueDate?: string;
}

// Helper function to generate a stable, random-looking alphanumeric ID based on the name
const generateSecureIdFromName = (name: string): string => {
  if (!name) return 'RED-000000';
  
  let hash = 0;
  const cleanName = name.trim().toLowerCase();
  for (let i = 0; i < cleanName.length; i++) {
    hash = (hash << 5) - hash + cleanName.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  
  // Convert absolute hash value to a positive hex string and pad/slice it
  const positiveHash = Math.abs(hash).toString(36).toUpperCase();
  const randomSuffix = Math.abs(hash * 31).toString(36).toUpperCase();
  
  return `RED-${positiveHash}${randomSuffix}`.slice(0, 11);
};

const styles = StyleSheet.create({
  page: {
    padding: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  badgeCard: {
    width: 252,
    height: 160,
    border: '1pt solid #cbd5e1',
    borderRadius: 4,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    position: 'relative',
  },
  // Top Third Black Header Bar
  headerContainer: {
    backgroundColor: '#1a1a1a',
    height: '33.33%',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  headerSpacer: {
    width: '34%',
  },
  logoWrapper: {
    position: 'absolute',
    left: '34%',
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 190,
    height: 'auto',
    objectFit: 'contain',
  },
  // Middle Content Area
  middleContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
  },
  spacerColumn: {
    width: '35%',
  },
  infoContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameText: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#1c1917',
    marginBottom: 4,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  roleBanner: {
    backgroundColor: '#dc2626',
    paddingVertical: 3,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleText: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  // Bottom Black Footer Bar
  footerContainer: {
    backgroundColor: '#1a1a1a',
    height: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  dateText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  // QR Code Styling inside the card
  qrContainer: {
    width: 28,
    height: 28,
    backgroundColor: '#ffffff',
    padding: 1,
    borderRadius: 2,
    position: 'absolute',
    right: 8,
    bottom: 26,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  // Wider Absolute Positioned Photo Frame
  photoFrame: {
    position: 'absolute',
    left: 10,
    top: 10,
    bottom: 26,
    width: '34.1%',
    backgroundColor: '#f5f5f4',
    border: '1pt solid #a8a29e',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
});

export const BadgeDocument: React.FC<BadgeDocumentProps> = ({ 
  badges, 
  issueDate = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase() 
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {badges.map((badge) => {
        // Generate a deterministic random ID based on the agent's name
        const secureBadgeId = generateSecureIdFromName(badge.name);
        
        // Use clean Supabase verification URL using the badge record/profile id
        const verifyData = badge.verificationUrl || 
          `https://training.reddelivers.com/verify?id=${badge.id || secureBadgeId}`;
        
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyData)}`;

        return (
          <View key={badge.id} style={styles.badgeCard} wrap={false}>
            {/* Top Third Black Header with Maximized Logo */}
            <View style={styles.headerContainer}>
              <View style={styles.headerSpacer} />
              <View style={styles.logoWrapper}>
                <Image 
                  src="https://static.wixstatic.com/media/34d825_e580ba21bc68413e9510a48b2143ac23~mv2.png/v1/fill/w_398,h_230,al_c,lg_1,q_85,enc_avif,quality_auto/RELIABLE%20EXPEDITED%20DELIVERY%20BLACK_edited.png" 
                  style={styles.logoImage} 
                />
              </View>
            </View>

            {/* Middle Body Area with Edge-to-Edge Role Banner */}
            <View style={styles.middleContainer}>
              <View style={styles.spacerColumn} />
              <View style={styles.infoContainer}>
                <Text style={styles.nameText}>
                  {badge.name ? badge.name.toUpperCase() : 'AGENT NAME'}
                </Text>
                
                <View style={styles.roleBanner}>
                  <Text style={styles.roleText}>
                    {badge.role ? badge.role.toUpperCase() : 'DELIVERY AGENT'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Scannable QR Code Positioned on the Card */}
            <View style={styles.qrContainer}>
              <Image src={qrCodeUrl} style={styles.qrImage} />
            </View>

            {/* Bottom Black Footer with Generated ID */}
            <View style={styles.footerContainer}>
              <Text style={styles.dateText}>
                ID: {secureBadgeId}
              </Text>
              <Text style={styles.dateText}>
                ISSUED: {issueDate.toUpperCase()}
              </Text>
            </View>

            {/* Overlapping Wider Photo Frame */}
            <View style={styles.photoFrame}>
              {badge.imageUrl ? (
                <Image src={badge.imageUrl} style={styles.avatar} />
              ) : null}
            </View>
          </View>
        );
      })}
    </Page>
  </Document>
);