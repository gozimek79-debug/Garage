import { HttpError } from "../http";

export type VehicleLookupResult = {
  registrationNumber: string;
  make: string;
  model: string;
  variant: string;
  year: number;
  fuelType: string;
};

export interface VehicleDataProvider {
  lookup(registration: string): Promise<VehicleLookupResult | null>;
  readonly demo: boolean;
  readonly name: string;
}

const records: Record<string, VehicleLookupResult> = {
  "12ABC3": { registrationNumber: "12-ABC-3", make: "Volkswagen", model: "Golf", variant: "1.5 TSI Life", year: 2021, fuelType: "Benzine" },
  "34DEF5": { registrationNumber: "34-DEF-5", make: "Toyota", model: "Yaris", variant: "Hybrid Dynamic", year: 2022, fuelType: "Hybride" },
  "56GHJ7": { registrationNumber: "56-GHJ-7", make: "Volvo", model: "V60", variant: "B4 Momentum", year: 2020, fuelType: "Benzine" },
  "78KLM9": { registrationNumber: "78-KLM-9", make: "Ford", model: "Focus", variant: "1.0 EcoBoost", year: 2019, fuelType: "Benzine" },
  "21NPR4": { registrationNumber: "21-NPR-4", make: "Kia", model: "Niro", variant: "1.6 GDi Hybrid", year: 2023, fuelType: "Hybride" },
  "43STU6": { registrationNumber: "43-STU-6", make: "Škoda", model: "Octavia", variant: "1.5 TSI", year: 2021, fuelType: "Benzine" },
  "65VWX8": { registrationNumber: "65-VWX-8", make: "Renault", model: "Clio", variant: "TCe 90", year: 2020, fuelType: "Benzine" },
  "87YZA2": { registrationNumber: "87-YZA-2", make: "BMW", model: "3 Serie", variant: "318i Touring", year: 2022, fuelType: "Benzine" },
  "13BCD4": { registrationNumber: "13-BCD-4", make: "Opel", model: "Corsa", variant: "1.2 Elegance", year: 2018, fuelType: "Benzine" },
  "35EFG6": { registrationNumber: "35-EFG-6", make: "Audi", model: "A3", variant: "Sportback 30 TFSI", year: 2021, fuelType: "Benzine" },
  "57HJK8": { registrationNumber: "57-HJK-8", make: "Mazda", model: "CX-30", variant: "SkyActiv-G", year: 2022, fuelType: "Benzine" },
  "79LMN1": { registrationNumber: "79-LMN-1", make: "Peugeot", model: "3008", variant: "1.2 PureTech", year: 2019, fuelType: "Benzine" },
  "24PQR6": { registrationNumber: "24-PQR-6", make: "Ford", model: "Transit", variant: "2.0 EcoBlue", year: 2020, fuelType: "Diesel" },
  "46STV8": { registrationNumber: "46-STV-8", make: "MINI", model: "Cooper", variant: "1.5 Chili", year: 2019, fuelType: "Benzine" },
  "68WXY3": { registrationNumber: "68-WXY-3", make: "Tesla", model: "Model 3", variant: "Long Range", year: 2023, fuelType: "Elektrisch" },
};

export class MockRDWProvider implements VehicleDataProvider {
  readonly demo = true;
  readonly name = "Fictional RDW lookup";

  async lookup(registration: string): Promise<VehicleLookupResult | null> {
    const normalized = registration.toUpperCase().replace(/[^A-Z0-9]/g, "");
    return records[normalized] ?? null;
  }
}

export const vehicleDataProvider: VehicleDataProvider = new MockRDWProvider();

export function requireLookupResult(
  result: VehicleLookupResult | null,
): VehicleLookupResult {
  if (!result) {
    throw new HttpError(
      404,
      "That registration is not in the fictional demo lookup. Try a seeded plate such as 12-ABC-3.",
      "vehicle_not_found",
    );
  }
  return result;
}
