import { SearchInput } from '../shared';
import { useUIStore } from '../../stores/uiStore';

type TodoSearchProps = {
  className?: string;
};

export function TodoSearch({ className }: TodoSearchProps) {
  const { searchQuery, setSearchQuery } = useUIStore();

  return (
    <SearchInput
      value={searchQuery}
      onChange={setSearchQuery}
      placeholder="Search todos..."
      className={className}
    />
  );
}
