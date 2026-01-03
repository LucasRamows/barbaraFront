import { Link } from "react-router-dom";

const LeftBar = () => {
  return (
    <div className=" hidden md:flex px-6 py-10 flex-col justify-between min-w-[270px] bg-popover">
      <div className="flex flex-col ">
        <div className="border-b border-gray-500 pb-2">
          <Link to="/" className="flex gap-3 items-center">
            <img src="/assets/react.svg" alt="" />
          </Link>
        </div>
      </div>
    </div>
  );
};
export default LeftBar;
