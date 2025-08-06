import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@heroui/react";

const SearchHistory = ({ searchData, clearData }) => {
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          variant="bordered"
          className="w-full sm:w-auto max-w-xs py-3 px-4 bg-blue-500 text-white text-lg font-semibold rounded-md shadow-md transition-all hover:scale-105 hover:bg-blue-600 cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Search History
        </Button>
      </DropdownTrigger>

      <DropdownMenu
        aria-label="Search History"
        onAction={(key) => {
          if (key === "clear") {
            clearData();
          }
        }}
      >
        {searchData.length > 0 ? (
          searchData.map((data, index) => (
            <DropdownItem key={index} textValue={data.city}>
      <div className="grid grid-cols-[1fr_auto] items-center bg-gray-300 p-2 w-56">
  <span className="break-words">{data.city}</span>
  <span className="text-gray-500 text-sm text-right">{data.time}</span>
</div>
            </DropdownItem>
          ))
        ) : (
          <DropdownItem key="no-data" disabled>
            <div className="bg-gray-300 p-2">No search history available</div>
          </DropdownItem>
        )}

        <DropdownItem
          key="clear"
          className="text-red-500 text-center mx-auto w-24 px-3 py-1 text-sm bg-red-100 rounded mt-2"
        >
          Clear
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};

export default SearchHistory;
