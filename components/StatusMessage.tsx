import { Transition } from "@headlessui/react";

type StatusMessageProps = {
  message: string;
  show: boolean;
};

const StatusMessage = ({ message, show }: StatusMessageProps) => {
  return (
    <Transition
      show={show}
      enter="transition ease-in-out duration-500"
      enterFrom="opacity-0 -translate-x-full "
      enterTo="opacity-100 translate-x-0"
      leave="transition ease-in-out duration-300"
      leaveFrom="opacity-100 translate-x-0"
      leaveTo="opacity-0 translate-x-full"
    >
      <p className="font-medium text-gray-900 absolute inset-x-0">{message}</p>
    </Transition>
  );
};

export default StatusMessage;
