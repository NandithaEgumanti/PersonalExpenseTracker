
import axios from "axios";

const API_URL = "http://localhost:8080/api/users";

export const getCurrentUser = async (email, password) => {
    const response = await axios.get(`${API_URL}/me`, {
        auth: {
            username: email,
            password: password
        }
    });

    return response.data;
};
