export const getTarget = (targetId, list) => {
  try {
    const thing = list.filter(target => target.id === targetId);
    return thing[0].min;
  } catch (error) {
    return 0;
  }
};

export const getScore2 = (competency, progresses) => {
  if (progresses && progresses.length > 0) {
    const relevantProgress = progresses[0].has_progress_root[0].child_progress.filter(
      progress => progress.competency_progress[0].id === competency.id
    );
    if (relevantProgress.length > 0) {
      return (
        relevantProgress[0].currentLevel * parseFloat(competency.default_weight)
      );
      // Todo: Handle non-default weight
    } else {
      return 0;
    }
  }
};

export const getScore = (competency, relevantProgress) => {
  if (relevantProgress.length > 0) {
    return (
      relevantProgress[0].currentLevel * parseFloat(competency.default_weight)
    );
    // Todo: Handle non-default weight
  } else {
    return 0;
  }
};
