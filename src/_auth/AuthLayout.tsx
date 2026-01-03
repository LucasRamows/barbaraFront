import { Navigate, Outlet } from "react-router-dom";

const AuthLayout = () => {
  const token = localStorage.getItem("token");
  return (
    <>
      {token ? (
        <Navigate to="/dashboard" />
      ) : (
        <div className="flex">
          <div className="flex flex-1 justify-center items-center flex-col py-10 h-screen md:h-auto">
            <Outlet />
          </div>
          <img
            className="hidden md:block h-screen w-1/2 object-cover bg-no-repeat"
            src="./public/assets/background.jpg"
            alt="img"
          />
        </div>
      )}
    </>
  );
};
export default AuthLayout;
