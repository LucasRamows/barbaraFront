const ProfessionalHeader = ({ worker }: any) => {
  if (!worker) return null;

  return (
    <div className="flex justify-between items-center w-full">
      <div className="flex gap-3 items-center">
        <img
          src={worker.imagePath ?? "assets/background.jpeg"}
          className="w-10 h-10 rounded-full object-cover object-top"
          alt={worker.nome}
        />
        <div>
          <p className="font-bold">{worker.nome}</p>
          <p className="text-sm text-gray-600">{worker.email}</p>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <p className="text-sm">Profissional</p>
        <p className="text-sm font-semibold">{worker.avaliacao} ★</p>
      </div>
    </div>
  );
};

export default ProfessionalHeader;
