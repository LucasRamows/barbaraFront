import axios from "axios";

const apiBack = axios.create({baseURL:"http://localhost:3000"})

export default apiBack;