import React from 'react';

const SimulationControls = ({ core, simulator }) => {
  const handleAddBatch = () => {
    // Generate and process 25 transactions
    for (let i = 0; i < 25; i++) {
      const transaction = simulator.generateTransaction();
      core.processTransaction(transaction);
    }
  };

  const handleRemoveBatch = () => {
    // Get and remove 25 oldest entities
    const oldestEntities = core.entityManager.getOldestEntities(25);
    oldestEntities.forEach(entity => {
      core.entityManager.removeEntity(entity.id);
    });
  };

  return (
    <div className="absolute bottom-4 right-4 flex gap-2" style={{ zIndex: 9999, pointerEvents: 'auto' }}>
      <button
        onClick={handleAddBatch}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
      >
        Add 25
      </button>
      <button
        onClick={handleRemoveBatch}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
      >
        Remove 25
      </button>
    </div>
  );
};

export default SimulationControls;