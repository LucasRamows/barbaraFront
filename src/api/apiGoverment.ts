import axios from "axios";

const apiGoverment = axios.create({baseURL:"https://servicodados.ibge.gov.br/api/v1"})

export default apiGoverment;