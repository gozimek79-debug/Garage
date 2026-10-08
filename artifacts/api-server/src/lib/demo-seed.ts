import { and, eq, inArray } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  auditEventsTable,
  bookingsTable,
  customersTable,
  demoOrdersTable,
  employeesTable,
  estimatesTable,
  garageCommercialRecordsTable,
  inventoryItemsTable,
  invoicesTable,
  locationsTable,
  notificationsTable,
  organizationsTable,
  pricingPackagesTable,
  servicesTable,
  shopProductsTable,
  usedVehicleLeadsTable,
  usedVehiclesTable,
  usersTable,
  vehiclesTable,
  vehicleHistoryGrantsTable,
  workOrderItemsTable,
  workOrdersTable,
  workshopResourcesTable,
  portableServiceRecordsTable,
} from "@workspace/db";

export const DEMO_ORG_ID = "org-van-dijk-auto";
export const DEMO_LOCATION_ID = "loc-utrecht";
export const PARTNER_ORG_ID = "org-noord-motorhuis";
export const PARTNER_LOCATION_ID = "loc-noord-motorhuis";
export const EMMA_CUSTOMER_ID = "customer-emma";
export const EMMA_VEHICLE_ID = "vehicle-golf";
export const BRAKE_WORK_ORDER_ID = "wo-brakes";
export const BRAKE_ESTIMATE_ID = "estimate-brakes";

const organizations = [
  {
    id: DEMO_ORG_ID,
    name: "Van Dijk Auto Service",
    slug: "van-dijk-auto-service",
    countryCode: "NL",
    primaryLanguage: "nl",
    languages: ["nl", "en"],
    brand: {
      primaryColor: "#D54C32",
      domain: "vandijkautoservice.example",
      logo: "VD",
    },
    status: "active",
  },
  {
    id: PARTNER_ORG_ID,
    name: "Noord Motorhuis",
    slug: "noord-motorhuis",
    countryCode: "NL",
    primaryLanguage: "nl",
    languages: ["nl", "en"],
    brand: {
      primaryColor: "#245B73",
      domain: "noordmotorhuis.example",
      logo: "NM",
    },
    status: "active",
  },
];

const locations = [
  {
    id: DEMO_LOCATION_ID,
    organizationId: DEMO_ORG_ID,
    name: "Utrecht",
    address: "Werkplaatslaan 18",
    postalCode: "3542 AB",
    city: "Utrecht",
    phone: "+31 30 555 0140",
    email: "service@vandijkautoservice.example",
    domain: "vandijkautoservice.example",
    openingHours: {
      monday: "08:00–17:30",
      tuesday: "08:00–17:30",
      wednesday: "08:00–17:30",
      thursday: "08:00–17:30",
      friday: "08:00–17:30",
      saturday: "09:00–13:00",
      sunday: "closed",
    } as Record<string, string>,
    isMain: true,
  },
  {
    id: PARTNER_LOCATION_ID,
    organizationId: PARTNER_ORG_ID,
    name: "Amersfoort",
    address: "Industrieweg 42",
    postalCode: "3812 NT",
    city: "Amersfoort",
    phone: "+31 33 555 0184",
    email: "werkplaats@noordmotorhuis.example",
    domain: "noordmotorhuis.example",
    openingHours: { weekdays: "08:00–17:00", saturday: "09:00–12:00" } as Record<string, string>,
    isMain: true,
  },
];

const customerNames = [
  ["Emma de Vries", "emma.devries@example.test", "06 1200 1041"],
  ["Jasper van Leeuwen", "jasper.leeuwen@example.test", "06 1200 1042"],
  ["Sophie Bakker", "sophie.bakker@example.test", "06 1200 1043"],
  ["Daan Visser", "daan.visser@example.test", "06 1200 1044"],
  ["Mila Smit", "mila.smit@example.test", "06 1200 1045"],
  ["Noah Meijer", "noah.meijer@example.test", "06 1200 1046"],
  ["Lotte de Boer", "lotte.deboer@example.test", "06 1200 1047"],
  ["Sem Mulder", "sem.mulder@example.test", "06 1200 1048"],
  ["Sara Bos", "sara.bos@example.test", "06 1200 1049"],
  ["Finn Vos", "finn.vos@example.test", "06 1200 1050"],
  ["Tess Peters", "tess.peters@example.test", "06 1200 1051"],
  ["Bram Hendriks", "bram.hendriks@example.test", "06 1200 1052"],
];

const vehicles = [
  { id: EMMA_VEHICLE_ID, customerId: EMMA_CUSTOMER_ID, registrationNumber: "12-ABC-3", make: "Volkswagen", model: "Golf", variant: "1.5 TSI Life", fuelType: "Benzine", year: 2021, mileage: 68420, apkExpiry: "2027-04-12" },
  { id: "vehicle-toyota", customerId: "customer-02", registrationNumber: "34-DEF-5", make: "Toyota", model: "Yaris", variant: "Hybrid Dynamic", fuelType: "Hybride", year: 2022, mileage: 42180, apkExpiry: "2027-09-03" },
  { id: "vehicle-volvo", customerId: "customer-03", registrationNumber: "56-GHJ-7", make: "Volvo", model: "V60", variant: "B4 Momentum", fuelType: "Benzine", year: 2020, mileage: 91200, apkExpiry: "2026-12-18" },
  { id: "vehicle-ford", customerId: "customer-04", registrationNumber: "78-KLM-9", make: "Ford", model: "Focus", variant: "1.0 EcoBoost", fuelType: "Benzine", year: 2019, mileage: 108540, apkExpiry: "2027-02-07" },
  { id: "vehicle-kia", customerId: "customer-05", registrationNumber: "21-NPR-4", make: "Kia", model: "Niro", variant: "1.6 GDi Hybrid", fuelType: "Hybride", year: 2023, mileage: 28390, apkExpiry: "2027-10-21" },
  { id: "vehicle-skoda", customerId: "customer-06", registrationNumber: "43-STU-6", make: "Škoda", model: "Octavia", variant: "1.5 TSI", fuelType: "Benzine", year: 2021, mileage: 74620, apkExpiry: "2027-06-12" },
  { id: "vehicle-renault", customerId: "customer-07", registrationNumber: "65-VWX-8", make: "Renault", model: "Clio", variant: "TCe 90", fuelType: "Benzine", year: 2020, mileage: 59610, apkExpiry: "2027-01-25" },
  { id: "vehicle-bmw", customerId: "customer-08", registrationNumber: "87-YZA-2", make: "BMW", model: "3 Serie", variant: "318i Touring", fuelType: "Benzine", year: 2022, mileage: 51200, apkExpiry: "2027-08-10" },
  { id: "vehicle-opel", customerId: "customer-09", registrationNumber: "13-BCD-4", make: "Opel", model: "Corsa", variant: "1.2 Elegance", fuelType: "Benzine", year: 2018, mileage: 120340, apkExpiry: "2026-11-30" },
  { id: "vehicle-audi", customerId: "customer-10", registrationNumber: "35-EFG-6", make: "Audi", model: "A3", variant: "Sportback 30 TFSI", fuelType: "Benzine", year: 2021, mileage: 63310, apkExpiry: "2027-05-16" },
  { id: "vehicle-mazda", customerId: "customer-11", registrationNumber: "57-HJK-8", make: "Mazda", model: "CX-30", variant: "SkyActiv-G", fuelType: "Benzine", year: 2022, mileage: 39450, apkExpiry: "2027-09-28" },
  { id: "vehicle-peugeot", customerId: "customer-12", registrationNumber: "79-LMN-1", make: "Peugeot", model: "3008", variant: "1.2 PureTech", fuelType: "Benzine", year: 2019, mileage: 88500, apkExpiry: "2027-03-02" },
  { id: "vehicle-transit", customerId: EMMA_CUSTOMER_ID, registrationNumber: "24-PQR-6", make: "Ford", model: "Transit", variant: "2.0 EcoBlue", fuelType: "Diesel", year: 2020, mileage: 137200, apkExpiry: "2027-01-17" },
  { id: "vehicle-mini", customerId: "customer-02", registrationNumber: "46-STV-8", make: "MINI", model: "Cooper", variant: "1.5 Chili", fuelType: "Benzine", year: 2019, mileage: 70980, apkExpiry: "2026-12-08" },
  { id: "vehicle-tesla", customerId: "customer-03", registrationNumber: "68-WXY-3", make: "Tesla", model: "Model 3", variant: "Long Range", fuelType: "Elektrisch", year: 2023, mileage: 31900, apkExpiry: "2027-11-05" },
];

const serviceRows = [
  ["service-apk", "APK", "Periodieke keuring en rapportage", 60, "52.50", "inspection"],
  ["service-small", "Kleine beurt", "Olie, filter en vaste inspectiepunten", 90, "189.00", "lift"],
  ["service-large", "Grote beurt", "Uitgebreide onderhoudsbeurt", 150, "349.00", "lift"],
  ["service-oil", "Olie + filter", "Verversing met kwaliteitsolie", 45, "119.00", "lift"],
  ["service-brakes", "Remmen", "Inspectie en onderhoud remsysteem", 120, "89.00", "lift"],
  ["service-tyres", "Banden", "Wisselen, balanceren of vervangen", 60, "69.00", "lift"],
  ["service-airco", "Airco", "Controle en service van het aircosysteem", 60, "99.00", "airco"],
  ["service-diagnosis", "Diagnose", "Uitlezen en technische diagnose", 60, "82.50", "diagnostic"],
  ["service-fault", "Storing", "Onderzoek naar een gemelde storing", 90, "112.50", "diagnostic"],
  ["service-other", "Overig", "Bespreek uw vraag met onze receptie", 60, "75.00", "lift"],
];

const employees = [
  ["employee-01", "Sanne van Dijk", "sanne@vandijkautoservice.example", "owner", "Bedrijfsleiding", "SV"],
  ["employee-02", "Thomas Vermeer", "thomas@vandijkautoservice.example", "manager", "Werkplaatschef", "TV"],
  ["employee-03", "Lina Bakker", "lina@vandijkautoservice.example", "reception", "Serviceadviseur", "LB"],
  ["employee-04", "Ruben Bos", "ruben@vandijkautoservice.example", "mechanic", "APK & onderhoud", "RB"],
  ["employee-05", "Milan de Jong", "milan@vandijkautoservice.example", "sales", "Occasions", "MJ"],
  ["employee-06", "Iris Smit", "iris@vandijkautoservice.example", "warehouse", "Onderdelen", "IS"],
];

const inventory = [
  ["part-oil-5w30", "OL-530-5L", "Motorolie 5W-30 5L", "Castrol", "26.40", "39.95", 21, 18, 6, "A-01"],
  ["part-filter-oil", "OF-0712", "Oliefilter", "MANN-FILTER", "7.25", "12.95", 21, 9, 5, "A-02"],
  ["part-brake-disc", "BD-288-F", "Remschijf vooras", "ATE", "61.00", "73.00", 21, 4, 4, "B-01"],
  ["part-brake-pad", "BP-2180-F", "Remblokset voor", "Bosch", "26.00", "34.00", 21, 3, 5, "B-02"],
  ["part-wiper", "WP-650-450", "Ruitenwisser set", "Bosch", "13.50", "24.95", 21, 12, 4, "C-01"],
  ["part-air-filter", "AF-C27009", "Luchtfilter", "MANN-FILTER", "10.20", "18.50", 21, 7, 4, "A-03"],
  ["part-cabin-filter", "CF-29013", "Interieurfilter", "MAHLE", "12.00", "21.95", 21, 5, 4, "A-04"],
  ["part-coolant", "CL-G12-5L", "Koelvloeistof G12 5L", "Febi", "11.50", "19.95", 21, 2, 3, "C-02"],
  ["part-lamp", "LB-H7-55W", "Halogeenlamp H7", "Osram", "5.10", "9.95", 21, 16, 5, "C-03"],
  ["part-spark", "SP-ILZKAR7", "Bougie", "NGK", "8.80", "15.50", 21, 24, 8, "D-01"],
  ["part-brake-fluid", "BF-DOT4-1L", "Remvloeistof DOT 4", "ATE", "8.10", "14.95", 21, 3, 4, "B-04"],
  ["part-battery", "BT-AGM-70", "Startaccu AGM 70Ah", "Varta", "108.00", "149.00", 21, 2, 2, "D-03"],
];

const usedVehicles = [
  { id: "used-golf", registration: "AB-123-C", make: "Volkswagen", model: "Golf", variant: "1.5 eTSI Style", year: 2022, mileage: 48200, fuel: "Benzine", transmission: "Automaat", price: "24950.00", description: "Comfortabele Golf met complete onderhoudshistorie en uitgebreide assistentiesystemen.", features: ["Adaptive cruise control", "Navigatie", "Apple CarPlay"], apk: "2027-08-14", serviceHistoryAvailable: true, status: "published" },
  { id: "used-yaris", registration: "DE-456-F", make: "Toyota", model: "Yaris", variant: "1.5 Hybrid Dynamic", year: 2021, mileage: 38600, fuel: "Hybride", transmission: "Automaat", price: "19850.00", description: "Zuinig en compleet onderhouden. Klaar voor een proefrit.", features: ["Achteruitrijcamera", "Stoelverwarming"], apk: "2027-04-22", serviceHistoryAvailable: true, status: "published" },
  { id: "used-v60", registration: "GH-789-J", make: "Volvo", model: "V60", variant: "B4 Momentum", year: 2020, mileage: 73400, fuel: "Benzine", transmission: "Automaat", price: "31950.00", description: "Ruime stationwagon met aantoonbare onderhoudshistorie.", features: ["Trekhaak", "Pilot Assist", "Elektrische achterklep"], apk: "2027-02-11", serviceHistoryAvailable: true, status: "published" },
  { id: "used-corsa", registration: "KL-234-M", make: "Opel", model: "Corsa", variant: "1.2 Edition", year: 2019, mileage: 62100, fuel: "Benzine", transmission: "Handgeschakeld", price: "13950.00", description: "Compacte stadsauto, netjes onderhouden en direct beschikbaar.", features: ["Parkeersensoren", "Airconditioning"], apk: "2026-12-19", serviceHistoryAvailable: false, status: "published" },
];

const products = [
  ["shop-oil", "5W-30 Longlife motorolie · 1L", "Olie", "Castrol", "14.95", 24, "Synthetische motorolie voor moderne benzine- en dieselmotoren."],
  ["shop-wipers", "AeroTwin ruitenwissers", "Ruitenwissers", "Bosch", "29.95", 11, "Stil en gelijkmatig wissen bij elk weertype."],
  ["shop-lamp", "Night Breaker H7 lampenset", "Verlichting", "Osram", "24.95", 18, "Helder halogeenlicht met verbeterd zicht op donkere wegen."],
  ["shop-screenwash", "All-season ruitensproeiervloeistof · 5L", "Vloeistoffen", "Kroon-Oil", "8.95", 30, "Beschermt en reinigt in zomer en winter."],
  ["shop-cabin", "Interieurfilter met actieve koolstof", "Filters", "MANN-FILTER", "22.50", 7, "Helpt pollen, stof en geuren uit de cabinelucht te filteren."],
  ["shop-microfiber", "Microvezel verzorgingsdoekenset", "Onderhoud", "Van Dijk Select", "12.95", 15, "Zachte doeken voor interieur en lak."],
  ["shop-coolant", "Koelvloeistof G12+ · 1L", "Vloeistoffen", "Febi", "9.95", 13, "Klaar voor gebruik, geschikt voor diverse VAG-modellen."],
  ["shop-tire-kit", "Bandenspanningsmeter", "Accessoires", "Michelin", "19.95", 8, "Compacte digitale meter met verlicht display."],
  ["shop-winter", "Wintercheck ruitenset", "Accessoires", "Van Dijk Select", "16.95", 6, "Ijskrabber en ruitenbeschermer voor onderweg."],
  ["shop-air-fresh", "Neutrale auto-interieur reiniger", "Onderhoud", "Turtle Wax", "11.95", 20, "Milde reiniger voor kunststof en dashboards."],
];

const now = new Date();
const setTime = (offsetDays: number, hour: number, minute: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hour, minute, 0, 0);
  return date;
};

const round2 = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;

const bookingRows = Array.from({ length: 20 }, (_, index) => {
  const customerIndex = index === 0 ? 0 : (index + 1) % customerNames.length;
  const vehicleIndex = index === 0 ? 0 : (index + 2) % vehicles.length;
  const serviceIndex = index === 0 ? 4 : index % serviceRows.length;
  const times = [
    [0, 8, 15], [0, 9, 30], [0, 11, 0], [0, 13, 0], [0, 15, 15],
    [1, 8, 30], [1, 10, 0], [1, 13, 30], [2, 9, 0], [2, 14, 15],
    [-1, 8, 0], [-1, 10, 30], [-2, 11, 0], [-3, 14, 0], [-4, 9, 15],
    [3, 8, 30], [4, 10, 0], [5, 13, 0], [6, 9, 30], [7, 11, 0],
  ][index];
  return {
    id: `booking-${String(index + 1).padStart(2, "0")}`,
    organizationId: DEMO_ORG_ID,
    locationId: DEMO_LOCATION_ID,
    customerId: vehicles[vehicleIndex]!.customerId,
    vehicleId: vehicles[vehicleIndex]!.id,
    serviceId: serviceRows[serviceIndex]![0] as string,
    startsAt: setTime(times![0]!, times![1]!, times![2]!),
    durationMinutes: Number(serviceRows[serviceIndex]![3]),
    status: index === 3
      ? "vehicle_received"
      : index === 10
        ? "completed"
        : index === 12
          ? "cancelled"
          : "confirmed",
    source: index % 3 === 0 ? "website" : index % 3 === 1 ? "phone" : "widget",
    problemDescription: index === 0
      ? "Remmen maken een schurend geluid. Graag voor de vakantie controleren."
      : ["Onderhoud volgens schema", "Controle bij lage snelheid", "APK en algemene inspectie"][index % 3],
    assignedMechanic: index % 2 === 0 ? "Ruben Bos" : "Omar Jansen",
    resource: index % 2 === 0 ? "Brug 1" : "Brug 2",
    createdAt: new Date(Date.now() - (index + 1) * 86_400_000),
    updatedAt: now,
  };
});

const moneyLine = (
  id: string,
  workOrderId: string,
  description: string,
  quantity: number,
  unitPrice: number,
  inventoryItemId: string | null = null,
) => ({
  id,
  organizationId: DEMO_ORG_ID,
  locationId: DEMO_LOCATION_ID,
  workOrderId,
  kind: inventoryItemId ? "part" : "labor",
  description,
  quantity: String(quantity),
  unitPrice: unitPrice.toFixed(2),
  vatRate: "21.00",
  total: round2(quantity * unitPrice).toFixed(2),
  inventoryItemId,
  status: "active",
});

async function ensureDemoSeedAdditions(): Promise<void> {
  await db.insert(workshopResourcesTable).values({
    id: "resource-airco",
    organizationId: DEMO_ORG_ID,
    locationId: DEMO_LOCATION_ID,
    name: "Airco-station",
    type: "airco",
    capacity: 1,
    status: "active",
  }).onConflictDoNothing();
  const [createdHistoryWorkOrder] = await db.insert(workOrdersTable).values({
    id: "wo-emma-history",
    organizationId: DEMO_ORG_ID,
    locationId: DEMO_LOCATION_ID,
    bookingId: "booking-11",
    customerId: EMMA_CUSTOMER_ID,
    vehicleId: vehicles[12]!.id,
    status: "completed",
    complaint: "Periodiek onderhoud.",
    diagnosis: "Voertuig gecontroleerd volgens onderhoudsschema.",
    workPerformed: "Motorolie en oliefilter vervangen; verlichting en remmen gecontroleerd.",
    assignedMechanic: "Ruben Bos",
    mileage: vehicles[12]!.mileage - 3200,
    fuelLevel: 57,
    visibleDamageNotes: "",
    additionalNotes: "",
  }).onConflictDoNothing().returning({ id: workOrdersTable.id });
  if (!createdHistoryWorkOrder) {
    const [existingHistoryWorkOrder] = await db
      .select({ id: workOrdersTable.id })
      .from(workOrdersTable)
      .where(and(
        eq(workOrdersTable.id, "wo-emma-history"),
        eq(workOrdersTable.organizationId, DEMO_ORG_ID),
      ))
      .limit(1);
    if (!existingHistoryWorkOrder) return;
  }
  await db.insert(workOrderItemsTable).values([
    moneyLine("item-emma-history-oil", "wo-emma-history", "Motorolie 5W-30", 1, 49.95, "part-oil-5w30"),
    moneyLine("item-emma-history-filter", "wo-emma-history", "Oliefilter", 1, 12.95, "part-filter-oil"),
    moneyLine("item-emma-history-labor", "wo-emma-history", "Periodiek onderhoud", 1, 95.00),
  ]).onConflictDoNothing();
  await db.insert(invoicesTable).values({
    id: "invoice-1054",
    organizationId: DEMO_ORG_ID,
    locationId: DEMO_LOCATION_ID,
    workOrderId: "wo-emma-history",
    customerId: EMMA_CUSTOMER_ID,
    invoiceNumber: "VD-2026-1054",
    date: new Date(Date.now() - 28 * 86_400_000),
    lines: [
      { description: "Periodiek onderhoud", quantity: 1, unitPrice: 157.90, vatRate: 21, total: 157.90 },
    ],
    vatTotal: "27.42",
    total: "157.90",
    paymentStatus: "paid",
    status: "issued",
  }).onConflictDoNothing();
  await db.insert(portableServiceRecordsTable).values({
    id: "passport-emma-periodic",
    organizationId: DEMO_ORG_ID,
    locationId: DEMO_LOCATION_ID,
    vehicleId: vehicles[12]!.id,
    workOrderId: "wo-emma-history",
    serviceDate: new Date(Date.now() - 28 * 86_400_000),
    mileage: vehicles[12]!.mileage - 3200,
    serviceType: "Periodiek onderhoud",
    workPerformed: "Motorolie en oliefilter vervangen; verlichting en remmen gecontroleerd.",
    partsInstalled: ["Motorolie 5W-30", "Oliefilter"],
    partManufacturer: "Castrol · MANN-FILTER",
    partNumber: "OL-530-5L · OF-0712",
    fluids: "5W-30 motorolie",
    technicalResult: "Voertuig technisch in orde; volgende onderhoudsbeurt volgens schema.",
    serviceGarage: "Van Dijk Auto Service · Amsterdam-Noord",
    verificationStatus: "verified",
    status: "published",
  }).onConflictDoNothing();
}

export async function seedDemoData(): Promise<void> {
  const [existing] = await db
    .select({ id: organizationsTable.id })
    .from(organizationsTable)
    .where(eq(organizationsTable.id, DEMO_ORG_ID))
    .limit(1);
  if (existing) {
    await ensureDemoSeedAdditions();
    return;
  }

  await db.insert(organizationsTable).values(organizations).onConflictDoNothing();
  await db.insert(locationsTable).values(locations).onConflictDoNothing();

  const customerRows = customerNames.map(([name, email, phone], index) => ({
    id: index === 0 ? EMMA_CUSTOMER_ID : `customer-${String(index + 1).padStart(2, "0")}`,
    organizationId: DEMO_ORG_ID,
    locationId: DEMO_LOCATION_ID,
    name,
    email,
    phone,
    preferredLanguage: index === 5 ? "en" : "nl",
    address: `${index + 11} Parklaan, ${index % 2 ? "Utrecht" : "Zeist"}`,
    notes: index === 0 ? "Kiest bij voorkeur voor een bericht via e-mail." : "",
    status: "active",
  }));
  await db.insert(customersTable).values(customerRows).onConflictDoNothing();
  await db.insert(vehiclesTable).values(
    vehicles.map((vehicle) => ({
      ...vehicle,
      organizationId: DEMO_ORG_ID,
      locationId: DEMO_LOCATION_ID,
      vin: null,
      variant: vehicle.variant,
      status: "active",
    })),
  ).onConflictDoNothing();

  await db.insert(usersTable).values({
    id: "demo-owner-placeholder",
    clerkUserId: "demo-placeholder-user-not-authenticated",
    organizationId: DEMO_ORG_ID,
    locationId: DEMO_LOCATION_ID,
    customerId: EMMA_CUSTOMER_ID,
    name: "Demo account",
    email: "demo@vandijkautoservice.example",
    role: "owner",
    status: "seed-placeholder",
  }).onConflictDoNothing();
  await db.insert(employeesTable).values(employees.map(([id, name, email, role, specialty, initials]) => ({
    id: id as string,
    organizationId: DEMO_ORG_ID,
    locationId: DEMO_LOCATION_ID,
    name: name as string,
    email: email as string,
    role: role as string,
    specialty: specialty as string,
    initials: initials as string,
    status: "active",
  }))).onConflictDoNothing();

  await db.insert(servicesTable).values(serviceRows.map(([id, name, description, duration, price, resource]) => ({
    id: id as string,
    organizationId: DEMO_ORG_ID,
    locationId: DEMO_LOCATION_ID,
    name: name as string,
    description: description as string,
    estimatedDurationMinutes: Number(duration),
    basePrice: price as string,
    requiredResourceType: resource as string,
    status: "active",
  }))).onConflictDoNothing();
  await db.insert(workshopResourcesTable).values([
    ["resource-lift-1", "Brug 1", "lift"],
    ["resource-lift-2", "Brug 2", "lift"],
    ["resource-inspection", "APK-lijn", "inspection"],
    ["resource-diagnostic", "Diagnoseplek", "diagnostic"],
      ["resource-airco", "Airco-station", "airco"],
  ].map(([id, name, type]) => ({
    id: id as string,
    organizationId: DEMO_ORG_ID,
    locationId: DEMO_LOCATION_ID,
    name: name as string,
    type: type as string,
    capacity: 1,
    status: "active",
  }))).onConflictDoNothing();
  await db.insert(pricingPackagesTable).values(
    serviceRows.slice(1, 4).flatMap(([serviceId]) =>
      (["Economy", "Standard", "Premium"] as const).map((tier, index) => ({
        id: `${serviceId}-${tier.toLowerCase()}`,
        organizationId: DEMO_ORG_ID,
        serviceId: serviceId as string,
        tier,
        priceModifier: ["-15.00", "0.00", "32.50"][index]!,
        description: `${tier} service package`,
        status: "active",
      })),
    ),
  ).onConflictDoNothing();

  await db.insert(bookingsTable).values(bookingRows).onConflictDoNothing();

  const workOrders = [
    {
      id: BRAKE_WORK_ORDER_ID,
      bookingId: "booking-01",
      customerId: EMMA_CUSTOMER_ID,
      vehicleId: EMMA_VEHICLE_ID,
      status: "waiting_approval",
      complaint: "Remmen maken een schurend geluid.",
      diagnosis: "Voorste remschijven zijn versleten. Remblokken hebben nog circa 15% materiaal. Achterremmen zijn in orde.",
      workPerformed: "",
      assignedMechanic: "Ruben Bos",
      mileage: 68420,
      fuelLevel: 42,
      visibleDamageNotes: "Kleine kras op rechter achtervelg, bij inname vastgelegd.",
      additionalNotes: "Klant belt voor 16:00 als extra werk nodig is.",
    },
    {
      id: "wo-service-in-repair",
      bookingId: "booking-02",
      customerId: vehicles[3]!.customerId,
      vehicleId: vehicles[3]!.id,
      status: "in_repair",
      complaint: "Onderhoud volgens schema.",
      diagnosis: "Olie en filters op interval; geen aanvullende punten gevonden.",
      workPerformed: "Onderhoud in uitvoering.",
      assignedMechanic: "Omar Jansen",
      mileage: vehicles[3]!.mileage,
      fuelLevel: 61,
      visibleDamageNotes: "",
      additionalNotes: "",
    },
    {
      id: "wo-ready",
      bookingId: "booking-04",
      customerId: vehicles[5]!.customerId,
      vehicleId: vehicles[5]!.id,
      status: "ready",
      complaint: "APK en algemene inspectie.",
      diagnosis: "APK-punten zijn akkoord; interieurfilter vervangen in overleg.",
      workPerformed: "Keuring afgerond. Interieurfilter vernieuwd.",
      assignedMechanic: "Ruben Bos",
      mileage: vehicles[5]!.mileage,
      fuelLevel: 34,
      visibleDamageNotes: "",
      additionalNotes: "",
    },
    {
      id: "wo-completed-history",
      bookingId: "booking-06",
      customerId: vehicles[1]!.customerId,
      vehicleId: vehicles[1]!.id,
      status: "completed",
      complaint: "Jaarlijks onderhoud.",
      diagnosis: "Geen aanvullende aandachtspunten.",
      workPerformed: "Olie, oliefilter en luchtfilter vervangen. Remmen gecontroleerd.",
      assignedMechanic: "Omar Jansen",
      mileage: vehicles[1]!.mileage - 2700,
      fuelLevel: 50,
      visibleDamageNotes: "",
      additionalNotes: "Commerciële notitie staat apart en wordt niet gedeeld.",
    },
    {
      id: "wo-emma-history",
      bookingId: "booking-11",
      customerId: EMMA_CUSTOMER_ID,
      vehicleId: vehicles[12]!.id,
      status: "completed",
      complaint: "Periodiek onderhoud.",
      diagnosis: "Voertuig gecontroleerd volgens onderhoudsschema.",
      workPerformed: "Motorolie en oliefilter vervangen; verlichting en remmen gecontroleerd.",
      assignedMechanic: "Ruben Bos",
      mileage: vehicles[12]!.mileage - 3200,
      fuelLevel: 57,
      visibleDamageNotes: "",
      additionalNotes: "",
    },
  ].map((workOrder) => ({
    ...workOrder,
    organizationId: DEMO_ORG_ID,
    locationId: DEMO_LOCATION_ID,
    status: workOrder.status,
  }));
  await db.insert(workOrdersTable).values(workOrders).onConflictDoNothing();

  await db.insert(workOrderItemsTable).values([
    moneyLine("item-brake-discs", BRAKE_WORK_ORDER_ID, "Remschijven vooras", 2, 60.33, "part-brake-disc"),
    moneyLine("item-brake-pads", BRAKE_WORK_ORDER_ID, "Remblokken vooras", 1, 56.20, "part-brake-pad"),
    moneyLine("item-brake-labor", BRAKE_WORK_ORDER_ID, "Arbeid · 1,5 uur", 1, 92.98),
    moneyLine("item-service-oil", "wo-service-in-repair", "Motorolie 5W-30", 1, 49.95, "part-oil-5w30"),
    moneyLine("item-service-labor", "wo-service-in-repair", "Onderhoudsbeurt", 1.5, 71.50),
    moneyLine("item-ready-filter", "wo-ready", "Interieurfilter", 1, 22.50, "part-cabin-filter"),
    moneyLine("item-ready-labor", "wo-ready", "APK-inspectie", 1, 52.50),
    moneyLine("item-history-oil", "wo-completed-history", "Motorolie 5W-30", 1, 49.95, "part-oil-5w30"),
    moneyLine("item-history-filter", "wo-completed-history", "Oliefilter", 1, 12.95, "part-filter-oil"),
    moneyLine("item-history-labor", "wo-completed-history", "Kleine beurt", 1, 95.00),
    moneyLine("item-emma-history-oil", "wo-emma-history", "Motorolie 5W-30", 1, 49.95, "part-oil-5w30"),
    moneyLine("item-emma-history-filter", "wo-emma-history", "Oliefilter", 1, 12.95, "part-filter-oil"),
    moneyLine("item-emma-history-labor", "wo-emma-history", "Periodiek onderhoud", 1, 95.00),
  ]).onConflictDoNothing();

  const brakeLines = [
    { description: "Remschijven vooras", quantity: 2, unitPrice: 60.33, vatRate: 21, total: 120.66 },
    { description: "Remblokken vooras", quantity: 1, unitPrice: 56.20, vatRate: 21, total: 56.20 },
    { description: "Arbeid · 1,5 uur", quantity: 1, unitPrice: 92.98, vatRate: 21, total: 92.98 },
  ];
  await db.insert(estimatesTable).values([
    {
      id: BRAKE_ESTIMATE_ID,
      organizationId: DEMO_ORG_ID,
      locationId: DEMO_LOCATION_ID,
      workOrderId: BRAKE_WORK_ORDER_ID,
      status: "sent",
      decision: null,
      lines: brakeLines,
      subtotal: "269.84",
      vatTotal: "56.66",
      total: "326.50",
      decisionTimestamp: null,
      customerMessage: "",
    },
    {
      id: "estimate-service",
      organizationId: DEMO_ORG_ID,
      locationId: DEMO_LOCATION_ID,
      workOrderId: "wo-service-in-repair",
      status: "approved",
      decision: "approve",
      lines: [{ description: "Grote beurt", quantity: 1, unitPrice: 342.15, vatRate: 21, total: 342.15 }],
      subtotal: "282.77",
      vatTotal: "59.38",
      total: "342.15",
      decisionTimestamp: new Date(Date.now() - 60 * 60 * 1000),
      customerMessage: "Akkoord, graag vandaag afronden.",
    },
  ]).onConflictDoNothing();

  await db.insert(invoicesTable).values([
    {
      id: "invoice-1047",
      organizationId: DEMO_ORG_ID,
      locationId: DEMO_LOCATION_ID,
      workOrderId: "wo-completed-history",
      customerId: vehicles[1]!.customerId,
      invoiceNumber: "VD-2026-1047",
      date: new Date(Date.now() - 10 * 86_400_000),
      lines: [
        { description: "Kleine beurt", quantity: 1, unitPrice: 157.90, vatRate: 21, total: 157.90 },
      ],
      vatTotal: "27.42",
      total: "157.90",
      paymentStatus: "paid",
      status: "issued",
    },
    {
      id: "invoice-1052",
      organizationId: DEMO_ORG_ID,
      locationId: DEMO_LOCATION_ID,
      workOrderId: "wo-ready",
      customerId: vehicles[5]!.customerId,
      invoiceNumber: "VD-2026-1052",
      date: new Date(),
      lines: [
        { description: "APK-inspectie", quantity: 1, unitPrice: 52.50, vatRate: 21, total: 52.50 },
        { description: "Interieurfilter", quantity: 1, unitPrice: 22.50, vatRate: 21, total: 22.50 },
      ],
      vatTotal: "13.02",
      total: "75.00",
      paymentStatus: "unpaid",
      status: "issued",
    },
    {
      id: "invoice-1054",
      organizationId: DEMO_ORG_ID,
      locationId: DEMO_LOCATION_ID,
      workOrderId: "wo-emma-history",
      customerId: EMMA_CUSTOMER_ID,
      invoiceNumber: "VD-2026-1054",
      date: new Date(Date.now() - 28 * 86_400_000),
      lines: [
        { description: "Periodiek onderhoud", quantity: 1, unitPrice: 157.90, vatRate: 21, total: 157.90 },
      ],
      vatTotal: "27.42",
      total: "157.90",
      paymentStatus: "paid",
      status: "issued",
    },
  ]).onConflictDoNothing();
  await db.insert(garageCommercialRecordsTable).values({
    id: "commercial-completed-history",
    organizationId: DEMO_ORG_ID,
    locationId: DEMO_LOCATION_ID,
    workOrderId: "wo-completed-history",
    invoiceId: "invoice-1047",
    privateNotes: "Fictieve commerciële notitie: klant kreeg een pakketkorting.",
    status: "completed",
  }).onConflictDoNothing();

  await db.insert(portableServiceRecordsTable).values([
    {
      id: "passport-toyota-major",
      organizationId: DEMO_ORG_ID,
      locationId: DEMO_LOCATION_ID,
      vehicleId: vehicles[1]!.id,
      workOrderId: "wo-completed-history",
      serviceDate: new Date(Date.now() - 10 * 86_400_000),
      mileage: vehicles[1]!.mileage - 2700,
      serviceType: "Kleine beurt",
      workPerformed: "Olie, oliefilter en luchtfilter vervangen. Remmen gecontroleerd.",
      partsInstalled: ["Motorolie 5W-30", "Oliefilter", "Luchtfilter"],
      partManufacturer: "Castrol · MANN-FILTER",
      partNumber: "OL-530-5L · OF-0712",
      fluids: "5W-30 motorolie",
      technicalResult: "Voertuig technisch in orde; geen vervolgwerk geadviseerd.",
      serviceGarage: "Van Dijk Auto Service · Utrecht",
      verificationStatus: "verified",
      status: "published",
    },
    {
      id: "passport-emma-periodic",
      organizationId: DEMO_ORG_ID,
      locationId: DEMO_LOCATION_ID,
      vehicleId: vehicles[12]!.id,
      workOrderId: "wo-emma-history",
      serviceDate: new Date(Date.now() - 28 * 86_400_000),
      mileage: vehicles[12]!.mileage - 3200,
      serviceType: "Periodiek onderhoud",
      workPerformed: "Motorolie en oliefilter vervangen; verlichting en remmen gecontroleerd.",
      partsInstalled: ["Motorolie 5W-30", "Oliefilter"],
      partManufacturer: "Castrol · MANN-FILTER",
      partNumber: "OL-530-5L · OF-0712",
      fluids: "5W-30 motorolie",
      technicalResult: "Voertuig technisch in orde; volgende onderhoudsbeurt volgens schema.",
      serviceGarage: "Van Dijk Auto Service · Amsterdam-Noord",
      verificationStatus: "verified",
      status: "published",
    },
  ]).onConflictDoNothing();

  await db.insert(inventoryItemsTable).values(inventory.map(([id, sku, name, brand, purchasePrice, salePrice, vatRate, stock, minimumStock, storageLocation]) => ({
    id: id as string,
    organizationId: DEMO_ORG_ID,
    locationId: DEMO_LOCATION_ID,
    sku: sku as string,
    partNumber: sku as string,
    name: name as string,
    brand: brand as string,
    purchasePrice: purchasePrice as string,
    salePrice: salePrice as string,
    vatRate: String(vatRate),
    stock: Number(stock),
    minimumStock: Number(minimumStock),
    storageLocation: storageLocation as string,
    compatibleVehicles: [],
    status: "active",
  }))).onConflictDoNothing();

  await db.insert(usedVehiclesTable).values(usedVehicles.map((vehicle) => ({
    ...vehicle,
    organizationId: DEMO_ORG_ID,
    locationId: DEMO_LOCATION_ID,
    features: vehicle.features,
    imageUrl: "",
  }))).onConflictDoNothing();
  await db.insert(shopProductsTable).values(products.map(([id, name, category, brand, price, stock, description]) => ({
    id: id as string,
    organizationId: DEMO_ORG_ID,
    locationId: DEMO_LOCATION_ID,
    name: name as string,
    category: category as string,
    brand: brand as string,
    price: price as string,
    stock: Number(stock),
    description: description as string,
    imageUrl: "",
    status: "active",
  }))).onConflictDoNothing();

  await db.insert(usedVehicleLeadsTable).values([
    {
      id: "lead-test-drive",
      organizationId: DEMO_ORG_ID,
      locationId: DEMO_LOCATION_ID,
      usedVehicleId: "used-golf",
      name: "Alex de Groot",
      email: "alex.groot@example.test",
      phone: "06 1200 2201",
      type: "test_drive",
      message: "Interesse in een proefrit op zaterdag.",
      status: "new",
    },
    {
      id: "lead-trade-in",
      organizationId: DEMO_ORG_ID,
      locationId: DEMO_LOCATION_ID,
      usedVehicleId: "used-v60",
      name: "Nina Jansen",
      email: "nina.jansen@example.test",
      phone: "06 1200 2202",
      type: "trade_in",
      message: "Inruilvraag over een stationwagon.",
      status: "new",
    },
  ]).onConflictDoNothing();

  await db.insert(notificationsTable).values([
    ["notification-booking", "Nieuwe online boeking", "Emma de Vries boekte een remmencontrole voor de Volkswagen Golf.", "booking"],
    ["notification-estimate", "Raming wacht op akkoord", "De remmenraming van € 326,50 staat klaar voor Emma.", "estimate"],
    ["notification-ready", "Auto gereed voor ophalen", "De Škoda Octavia is gereed voor collectie.", "vehicle"],
    ["notification-apk", "APK-herinnering", "De APK van de Opel Corsa verloopt binnenkort.", "reminder"],
    ["notification-history", "Servicehistorie gedeeld", "Een technisch serviceverslag is beschikbaar in het Service Passport.", "service"],
  ].map(([id, title, message, type]) => ({
    id: id as string,
    organizationId: DEMO_ORG_ID,
    locationId: DEMO_LOCATION_ID,
    customerId: null,
    title: title as string,
    message: message as string,
    type: type as string,
    read: false,
    status: "active",
  }))).onConflictDoNothing();
}

export async function resetDemoData(): Promise<void> {
  const orgIds = [DEMO_ORG_ID, PARTNER_ORG_ID];
  await db.transaction(async (tx) => {
    await tx.delete(auditEventsTable).where(inArray(auditEventsTable.organizationId, orgIds));
    await tx.delete(notificationsTable).where(inArray(notificationsTable.organizationId, orgIds));
    await tx.delete(usedVehicleLeadsTable).where(inArray(usedVehicleLeadsTable.organizationId, orgIds));
    await tx.delete(demoOrdersTable).where(inArray(demoOrdersTable.organizationId, orgIds));
    await tx.delete(shopProductsTable).where(inArray(shopProductsTable.organizationId, orgIds));
    await tx.delete(usedVehiclesTable).where(inArray(usedVehiclesTable.organizationId, orgIds));
    await tx.delete(inventoryItemsTable).where(inArray(inventoryItemsTable.organizationId, orgIds));
    await tx.delete(vehicleHistoryGrantsTable).where(inArray(vehicleHistoryGrantsTable.organizationId, orgIds));
    await tx.delete(portableServiceRecordsTable).where(inArray(portableServiceRecordsTable.organizationId, orgIds));
    await tx.delete(garageCommercialRecordsTable).where(inArray(garageCommercialRecordsTable.organizationId, orgIds));
    await tx.delete(invoicesTable).where(inArray(invoicesTable.organizationId, orgIds));
    await tx.delete(estimatesTable).where(inArray(estimatesTable.organizationId, orgIds));
    await tx.delete(workOrderItemsTable).where(inArray(workOrderItemsTable.organizationId, orgIds));
    await tx.delete(workOrdersTable).where(inArray(workOrdersTable.organizationId, orgIds));
    await tx.delete(bookingsTable).where(inArray(bookingsTable.organizationId, orgIds));
    await tx.delete(pricingPackagesTable).where(inArray(pricingPackagesTable.organizationId, orgIds));
    await tx.delete(workshopResourcesTable).where(inArray(workshopResourcesTable.organizationId, orgIds));
    await tx.delete(employeesTable).where(inArray(employeesTable.organizationId, orgIds));
    await tx.delete(usersTable).where(inArray(usersTable.organizationId, orgIds));
    await tx.delete(servicesTable).where(inArray(servicesTable.organizationId, orgIds));
    await tx.delete(vehiclesTable).where(inArray(vehiclesTable.organizationId, orgIds));
    await tx.delete(customersTable).where(inArray(customersTable.organizationId, orgIds));
    await tx.delete(locationsTable).where(inArray(locationsTable.organizationId, orgIds));
    await tx.delete(organizationsTable).where(inArray(organizationsTable.id, orgIds));
  });
  await seedDemoData();
}

export async function ensureDemoSeed(): Promise<void> {
  await seedDemoData();
}
