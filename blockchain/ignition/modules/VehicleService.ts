import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("VehicleServiceModule", (m) => {
    const vehicleService = m.contract("VehicleService");
    return { vehicleService };
});