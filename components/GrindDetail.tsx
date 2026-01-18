import React from 'react';

const GrindDetail = ({ onBack }: any) => {
  return (
    <div className="p-4">
      <button
        onClick={onBack}
        className="text-emerald-400 mb-2"
      >
        ← Back
      </button>
      <h2 className="text-lg font-bold">Grind Detail</h2>
    </div>
  );
};

export default GrindDetail;
