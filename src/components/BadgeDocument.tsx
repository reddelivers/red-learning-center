import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

interface BadgeData {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
}

interface BadgeDocumentProps {
  badges: BadgeData[];
  issueDate?: string;
}

// Styles updated for edge-to-edge full-width role banner
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
    // Removed internal padding so the image can utilize 100% of the box
  },
  logoImage: {
    width: 190, // Bumper width to force it larger
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
    // No horizontal padding so the banner can stretch fully edge-to-edge
  },
  nameText: {
    fontSize: 13.5,
    fontFamily: 'Helvetica-Bold',
    color: '#1c1917',
    marginBottom: 6,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  roleBanner: {
    backgroundColor: '#dc2626',
    paddingVertical: 3.5,
    width: '100%', // Stretches edge-to-edge across the column
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleText: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  // Bottom Black Footer Bar
  footerContainer: {
    backgroundColor: '#1a1a1a',
    height: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
  },
  dateText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
  // Wider Absolute Positioned Photo Frame
  photoFrame: {
    position: 'absolute',
    left: 10,
    top: 10,
    bottom: 20,
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
}) => (  <Document>
    <Page size="A4" style={styles.page}>
      {badges.map((badge) => (
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

          {/* Bottom Black Footer with Larger Issued Date */}
          <View style={styles.footerContainer}>
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
      ))}
    </Page>
  </Document>
);