import { Link } from "react-router-dom";
const TopBar = () => {
  return <div className="sticky top-0 z-50 md:hidden bg-dark-2 w-full">
    <div className="flex justify-between py-4 px-5">
      <Link to="/" className="flex gap-3 items-center">
      <img src="/assets/react.svg" alt="" /></Link>
      <div className="flex">
        <Link to="" className="flex justify-center gap-3">
          <img src="/assets/background.jpeg" alt="profile" className="h-8 w-8 rounded-full"/>
        </Link>
      </div>
    </div>
  </div>;
};
export default TopBar;
