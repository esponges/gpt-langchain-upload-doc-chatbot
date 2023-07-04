/* eslint-disable max-len */
export interface Props {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  outerCloseBtn?: boolean;
  title?: string;
  showActions?: boolean;
  bgColor?: string;
}

export const Modal = ({
  children,
  isOpen,
  onClose,
  title,
  showActions,
  bgColor,
  outerCloseBtn,
}: Props) => {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[102] 
        flex min-w-full items-center justify-center 
        overflow-y-auto overflow-x-hidden 
        outline-none focus:outline-none"
      >
        <div className="relative my-6 mx-auto w-auto md:max-w-6xl lg:min-w-[40%]">
          {outerCloseBtn && (
            <button
              className="absolute -top-6 -right-6 ml-auto
                border-0 bg-transparent p-1 text-3xl font-semibold
                leading-none text-black opacity-50"
              onClick={onClose}
            >
              <span className="h-6 w-6 bg-transparent text-2xl text-black outline-none focus:outline-none">
                ×
              </span>
            </button>
          )}
          {/* content */}
          <div
            className={`relative flex w-full flex-col rounded-lg border-0 ${
              bgColor ?? "bg-white"
            } shadow-lg outline-none focus:outline-none`}
          >
            {/* header */}
            {title && (
              <div
                className={`
              modal__header border-blueGray-200 flex 
              items-start items-center justify-center justify-between
              rounded-t ${title ? "border-b border-solid" : ""} p-5`}
              >
                <h6 className="mb-0 font-semibold">{title}</h6>
                <button
                  className="float-right ml-auto border-0
                bg-transparent p-1 text-3xl
                font-semibold leading-none text-black
                opacity-75 outline-none focus:outline-none"
                  onClick={onClose}
                >
                  <span className="h-6 w-6 bg-white text-2xl text-black outline-none focus:outline-none">
                    ×
                  </span>
                </button>
                {/* outside div x close btn */}
              </div>
            )}
            {/* body */}
            <div>
              <div className="text-blueGray-500 m-4 text-lg leading-relaxed">
                {children}
              </div>
            </div>
            {/* actions */}
            {showActions && (
              <div className="border-blueGray-200 flex items-center justify-end rounded-b border-t border-solid p-6">
                <button
                  className="mr-1 mb-1 rounded bg-red-500 px-6
                py-3 text-sm font-bold uppercase text-white shadow outline-none 
                transition-all duration-150 ease-linear 
                hover:shadow-lg focus:outline-none active:bg-red-600"
                  type="button"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="fixed inset-0 z-[101] bg-black opacity-25" />
    </>
  );
};
