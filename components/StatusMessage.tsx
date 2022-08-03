import { Transition } from "@headlessui/react";
import { PermissionStatus } from "../pages/connect/[uid]";
type StatusProps = {
  message: string;
  show: boolean;
};

const Status = ({ message, show }: StatusProps) => {
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

const StatusMessage = ({
  permissionStatus,
}: {
  permissionStatus: PermissionStatus | null | undefined;
}) => {
  return (
    <div className="h-12 mx-auto w-full text-center ">
      <Status
        message="Token found! Updating your Discord permissions..."
        show={permissionStatus === PermissionStatus.Loading}
      />
      <Status
        message="Error updating your Discord permissions"
        show={permissionStatus === PermissionStatus.Error}
      />
      <Status
        message="These tokens have already been assigned to another user."
        show={permissionStatus === PermissionStatus.TokensAlreadyClaimed}
      />
      <Status
        message="Access has already been granted."
        show={permissionStatus === PermissionStatus.RoleAlreadyAssigned}
      />
      <Status
        message="Success! Full access to the Discord server granted."
        show={permissionStatus === PermissionStatus.Success}
      />
      <Status
        message="Uh-oh, you don't have the required token."
        show={permissionStatus === PermissionStatus.NoToken}
      />
    </div>
  );
};
export default StatusMessage;
