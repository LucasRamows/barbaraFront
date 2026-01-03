"use client";

import { useEffect, useState } from "react";
import apiGoverment from "../../api/apiGoverment";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";

interface City {
  id: number;
  name: string;
  state: string;
}

const CitySearch = () => {
  const [query, setQuery] = useState("");
  const [isSelected, setIsSelected] = useState(false);
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await apiGoverment.get("/localidades/municipios");
        const mappedCities = await response.data.map((c: any) => ({
          id: c.id,
          name: c.nome,
          state: c.microrregiao?.mesorregiao?.UF?.sigla ?? "N/A",
        }));
        setCities(mappedCities);
        console.log(mappedCities);
      } catch (error) {
        console.error("Erro ao buscar cidades:", error);
      }
    };

    fetchCities();
  }, []);

  return (
    <div className="w-full">
      <Command>
        <CommandInput
          className="shad-input"
          placeholder="Digite o nome da cidade..."
          value={query}
          onValueChange={(value) => {
            setQuery(value);
            setIsSelected(false);
          }}
        />
        <CommandList>
          {query.trim() === "" || isSelected ? null : (
            <div>
              <CommandGroup heading="Cidades">
                {cities
                  .filter((city) =>
                    city.name.toLowerCase().includes(query.toLowerCase())
                  )
                  .map((city) => (
                    <CommandItem
                      key={city.id}
                      value={city.name}
                      onSelect={() => {
                        setQuery(city.name + "-" + city.state);
                        setIsSelected(true);
                      }}
                    >
                      {city.name} - {city.state}
                    </CommandItem>
                  ))}
              </CommandGroup>
              <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
            </div>
          )}
        </CommandList>
      </Command>
    </div>
  );
};

export default CitySearch;
