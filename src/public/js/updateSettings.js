/* eslint-disable */
import axios from "axios";
import { showAlert } from "./alerts";

export const updateSettings = async (data, type) => {
  try {
    const urlApi = "/api/v1/users";
    const url = urlApi + (type === "password" ? "/updateMyPassword" : "/me");
    // console.log(data);
    const res = await axios({
      method: "PATCH",
      url,
      data,
    });

    if (res.data.status === "success") {
      showAlert("success", "Cadastro alterado com sucesso!");
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};
