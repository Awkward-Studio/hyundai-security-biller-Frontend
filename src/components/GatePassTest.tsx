import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { CarRecord, TempCarRecord } from "@/lib/appwrite";

Font.register({
  family: "Open Sans",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-600.ttf",
      fontWeight: 600,
    },
  ],
});

const styles = StyleSheet.create({
  page: { display: "flex", padding: "20px", marginTop: "20px" },
  addressRow: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  logo: { width: 100, height: 30 },
  Maruti_Logo: { width: 100, height: 100 },
  logoView: { display: "flex", flexDirection: "row", alignItems: "center" },
  addressBlock: { display: "flex", flexDirection: "column", width: "40%" },
  workShopName: {
    fontSize: 12,
    fontFamily: "Open Sans",
    fontWeight: "black",
    alignSelf: "flex-end",
  },
  workShopAddress: {
    fontSize: 12,
    fontFamily: "Open Sans",
    alignSelf: "flex-end",
  },
  workShopGST: {
    fontSize: 12,
    fontFamily: "Open Sans",
    fontWeight: "black",
    alignSelf: "flex-end",
  },
  invoiceTypeRow: { width: "100%", marginBottom: 10 },
  invoiceType: {
    fontSize: 14,
    fontFamily: "Open Sans",
    fontWeight: "black",
    textAlign: "center",
  },
  gatePassHeading: { fontSize: 24 },
  gatePassDate: { marginBottom: 30 },
  detailTablesRow: {
    width: "100%",
    marginBottom: 20,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  detailTable: { width: 180, borderWidth: 1.5, borderColor: "#000000" },
  tableTitleRow: {
    width: "100%",
    backgroundColor: "#D1D5DB",
    textAlign: "center",
  },
  tableTitle: {
    fontSize: 11,
    fontFamily: "Open Sans",
    fontWeight: "black",
    padding: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: "#000000",
  },
  tableRow: { display: "flex", flexDirection: "row" },
  tableCell: { borderWidth: 0.5, borderColor: "#000000", width: "50%" },
  tableData: { fontSize: 11, padding: 5 },
  tableDataEmphasized: { fontFamily: "Open Sans", fontWeight: "black" },
  signBlock: { display: "flex", flexDirection: "column", width: "40%" },
  signName: {
    fontSize: 12,
    fontFamily: "Open Sans",
    fontWeight: "black",
    marginTop: 20,
  },
  signAddress: {
    fontSize: 12,
    fontFamily: "Open Sans",
    marginTop: 60,
    alignSelf: "flex-start",
  },
});

type GatePassProps = {
  car: CarRecord; // master car record (customer + make/model)
  tempCar: TempCarRecord; // temp car row (status, carNumber, $id, etc.)
  logo: string;
  marutiLogo: string;
  currentDate: Date;
  invoiceType: string;
};

export const GatePassPDF = ({
  car,
  tempCar,
  logo,
  marutiLogo,
  currentDate,
  invoiceType,
}: GatePassProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.addressRow}>
        <View style={styles.logoView}>
          <Image style={styles.Maruti_Logo} src={marutiLogo} />
          <Image style={styles.logo} src={logo} />
        </View>
        <View style={styles.addressBlock}>
          <Text style={styles.workShopName}>CHAMUNDA MOTORS PVT. LTD.</Text>
          <Text style={styles.workShopAddress}>
            21/1-1, RAM BAUGH, OFF S V ROAD,{"\n"}BORIVALI WEST, MUMBAI SUBURBAN
          </Text>
          <Text style={styles.workShopGST}>GST NO: 27AAACC1903H1Z4</Text>
        </View>
      </View>

      {/* Title */}
      <View style={styles.invoiceTypeRow}>
        <Text style={[styles.invoiceType, styles.gatePassHeading]}>
          {invoiceType}
        </Text>
      </View>
      <View style={[styles.invoiceTypeRow, styles.gatePassDate]}>
        <Text style={styles.invoiceType}>
          {currentDate.toDateString()} , {currentDate.toLocaleTimeString()}
        </Text>
      </View>

      {/* Details */}
      <View style={styles.detailTablesRow}>
        {/* Customer */}
        <View style={styles.detailTable}>
          <View style={styles.tableTitleRow}>
            <Text style={styles.tableTitle}>Customer Details</Text>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCell}>
              <Text style={[styles.tableData, styles.tableDataEmphasized]}>
                Name:
              </Text>
            </View>
            <View style={styles.tableCell}>
              <Text style={styles.tableData}>{car.customerName || "-"}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCell}>
              <Text style={[styles.tableData, styles.tableDataEmphasized]}>
                Mobile:
              </Text>
            </View>
            <View style={styles.tableCell}>
              <Text style={styles.tableData}>{car.customerPhone || "-"}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCell}>
              <Text style={[styles.tableData, styles.tableDataEmphasized]}>
                Address:
              </Text>
            </View>
            <View style={styles.tableCell}>
              <Text style={styles.tableData}>{car.customerAddress || "-"}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCell}>
              <Text style={[styles.tableData, styles.tableDataEmphasized]}>
                Gate Pass No.:
              </Text>
            </View>
            <View style={styles.tableCell}>
              <Text style={styles.tableData}>GP-{tempCar.$id}</Text>
            </View>
          </View>
        </View>

        {/* Vehicle */}
        <View style={styles.detailTable}>
          <View style={styles.tableTitleRow}>
            <Text style={styles.tableTitle}>Vehicle Details</Text>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCell}>
              <Text style={[styles.tableData, styles.tableDataEmphasized]}>
                Registration:
              </Text>
            </View>
            <View style={styles.tableCell}>
              <Text style={styles.tableData}>{tempCar.carNumber}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCell}>
              <Text style={[styles.tableData, styles.tableDataEmphasized]}>
                Make:
              </Text>
            </View>
            <View style={styles.tableCell}>
              <Text style={styles.tableData}>{car.carMake}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCell}>
              <Text style={[styles.tableData, styles.tableDataEmphasized]}>
                Model:
              </Text>
            </View>
            <View style={styles.tableCell}>
              <Text style={styles.tableData}>{car.carModel}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.addressRow}>
        <View style={[styles.signBlock, { marginTop: 20 }]}>
          <Text style={[styles.signName, { marginTop: 60 }]}>
            For CHAMUNDA MOTORS PVT. LTD.
          </Text>
          <Text style={styles.signAddress}>(Authorized Signatory)</Text>
        </View>
      </View>
    </Page>
  </Document>
);
