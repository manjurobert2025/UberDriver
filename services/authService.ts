import api from "./api";

export const registerUser = (user: any) => {
    return api.post("/auth/register", user);
};

export const loginUser = (login: any) => {
    return api.post("/auth/login", login);
};

export const forgotPassword = async (email: string) => {
    const response = await api.post("/auth/forgot-password", {
        email: email
    });

    return response.data;
};

export const resetPassword = async (
    email: string,
    token: string,
    newPassword: string
) => {
    const response = await api.post("/auth/reset-password", {
        email: email,
        token: token,
        newPassword: newPassword
    });

    return response.data;
};