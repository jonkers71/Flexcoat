import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { Job } from '@/lib/types';

// Register a clean font if possible, otherwise use defaults
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottom: 2,
    borderBottomColor: '#0096D6', // Flexcoat Cyan
    paddingBottom: 15,
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 'auto',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B3D6D', // Flexcoat Navy
    textTransform: 'uppercase',
  },
  subTitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  infoSection: {
    marginBottom: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoBox: {
    width: '50%',
    marginBottom: 10,
  },
  label: {
    fontSize: 8,
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  value: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    backgroundColor: '#f1f5f9',
    padding: 5,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1e293b',
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingVertical: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 5,
  },
  col1: { width: '50%', paddingLeft: 5 },
  col2: { width: '10%', textAlign: 'center' },
  col3: { width: '15%', textAlign: 'center' },
  col4: { width: '15%', textAlign: 'center' },
  col5: { width: '10%', textAlign: 'right', paddingRight: 5 },
  headerText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748b',
  },
  totalSection: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 10,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  }
});

export const JobPDF = ({ job }: { job: Job }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Image src="e:/GitRepos/flexcoat_app/public/logo.png" style={styles.logo} />
          <Text style={styles.subTitle}>Job Completion Card</Text>
        </View>
        <View style={{ textAlign: 'right' }}>
          <Text style={styles.label}>Date Generated</Text>
          <Text style={styles.value}>{job.date}</Text>
        </View>
      </View>

      {/* Client Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoBox}>
          <Text style={styles.label}>Customer Name</Text>
          <Text style={styles.value}>{job.customerName || 'N/A'}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.label}>Quote / Job Number</Text>
          <Text style={styles.value}>{job.quoteNumber || 'N/A'}</Text>
        </View>
        <View style={{ width: '100%' }}>
          <Text style={styles.label}>Site Address</Text>
          <Text style={styles.value}>{job.address || 'N/A'}</Text>
        </View>
      </View>

      {/* Sections */}
      {job.sections.filter(s => s.items.some(i => i.quantity > 0)).map((section) => (
        <View key={section.id} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          
          <View style={styles.tableHeader}>
            <Text style={[styles.col1, styles.headerText]}>Item Description</Text>
            <Text style={[styles.col2, styles.headerText]}>Unit</Text>
            <Text style={[styles.col3, styles.headerText]}>Qty</Text>
            <Text style={[styles.col4, styles.headerText]}>Rate</Text>
            <Text style={[styles.col5, styles.headerText]}>Total</Text>
          </View>

          {section.items.filter(i => i.quantity > 0).map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.col1}>{item.name}</Text>
              <Text style={styles.col2}>{item.unit}</Text>
              <Text style={styles.col3}>{item.quantity}</Text>
              <Text style={styles.col4}>${item.rate.toFixed(2)}</Text>
              <Text style={styles.col5}>${item.total.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      ))}

      {/* Grand Total */}
      <View style={styles.totalSection}>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.label}>Grand Total (inc. GST if applicable)</Text>
          <Text style={styles.totalValue}>${job.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </View>
      </View>

      <Text style={styles.footer}>
        FlexCoat Waterproofing Solutions - Quality Guaranteed
      </Text>
    </Page>
  </Document>
);
