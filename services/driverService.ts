import api from "./api";

export const registerDriver = (driver: any) => {
    return api.post("/driver/register", driver);
};