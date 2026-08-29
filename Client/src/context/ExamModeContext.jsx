import { createContext, useContext, useState } from 'react';

const ExamModeContext = createContext();

export const ExamModeProvider = ({ children }) => {
  const [isExamActive, setIsExamActive] = useState(false);

  return (
    <ExamModeContext.Provider value={{ isExamActive, setIsExamActive }}>
      {children}
    </ExamModeContext.Provider>
  );
};

export const useExamMode = () => useContext(ExamModeContext);