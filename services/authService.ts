import api from "./api";

export const registerUser = (user: any) => {
    return api.post("/auth/register", user);
};

export const loginUser = (login: any) => {
    return api.post("/auth/login", login);
};