// unity-voice-frontend/src/app/components/LearningProcessGuide.tsx
import React, { useState } from 'react';
import { FaBookOpen, FaQuestionCircle, FaComments, FaMicrophone, FaCheck, FaArrowRight, FaStar, FaPlay, FaInfoCircle, FaTimes } from 'react-icons/fa';

interface LearningProcessGuideProps {
  isVisible?: boolean;
  onToggle?: () => void;
  showIcon?: boolean;
}

const LearningProcessGuide: React.FC<LearningProcessGuideProps> = ({ 
  isVisible = false, 
  onToggle,
  showIcon = true 
}) => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 1,
      title: "כרטיסיות לימוד",
      icon: <FaBookOpen className="text-2xl" />,
      color: "bg-blue-500",
      hoverColor: "hover:bg-blue-600",
      description: "למד מילים חדשות בנושא שבחרת",
      details: [
        "קבל רשימת מילים רלוונטיות לנושא",
        "עבור על כל מילה ולמד את המשמעות שלה",
        "חשוב ללמוד גם מילים שאתה מכיר - זה חלק מהתהליך",
        "סמן כל מילה כ'נלמדה' כדי להמשיך הלאה",
        "רק אחרי שתסמן את כל המילים תוכל להמשיך לשלב הבא"
      ],
      requirement: "חובה לעבור על כל המילים",
      minScore: null
    },
    {
      id: 2,
      title: "בוחן מילים",
      icon: <FaQuestionCircle className="text-2xl" />,
      color: "bg-orange-500",
      hoverColor: "hover:bg-orange-600",
      description: "בחן את עצמך על המילים שלמדת",
      details: [
        "בוחן רב ברירה על המילים שלמדת בכרטיסיות",
        "השאלות מתבססות רק על המילים שעברת עליהן",
        "קבל ניקוד מיידי על כל תשובה",
        "ראה סיכום מפורט עם התשובות הנכונות והשגויות",
        "תוכל לנסות שוב אם לא עברת"
      ],
      requirement: "ציון עובר: 60% לפחות",
      minScore: "60%"
    },
    {
      id: 3,
      title: "משימת פוסט",
      icon: <FaComments className="text-2xl" />,
      color: "bg-green-500",
      hoverColor: "hover:bg-green-600",
      description: "הגב על פוסט מרשתות חברתיות",
      details: [
        "קבל פוסט אמיתי מרשתות חברתיות בנושא שבחרת",
        "הפוסט כולל את המילים שלמדת בהקשר טבעי",
        "כתוב תגובה משמעותית על הפוסט",
        "השתמש במילים הנדרשות בתגובה שלך",
        "קבל משוב מפורט על התגובה מהמערכת"
      ],
      requirement: "השלמת המשימה בהצלחה",
      minScore: null
    },
    {
      id: 4,
      title: "שיחה אינטראקטיבית",
      icon: <FaMicrophone className="text-2xl" />,
      color: "bg-purple-500",
      hoverColor: "hover:bg-purple-600",
      description: "נהל שיחה חיה עם המערכת",
      details: [
        "שוחח עם המערכת באמצעות הקול שלך",
        "המערכת תשאל אותך שאלות בנושא",
        "אתה יכול גם לשאול שאלות ולנהל דיאלוג טבעי",
        "קבל משוב מיידי על הגייה, דקדוק ותוכן",
        "השיחה מותאמת לרמה שלך ולנושא שבחרת"
      ],
      requirement: "השלמת השיחה",
      minScore: "ניקוד: 0-400 נקודות"
    }
  ];

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < activeStep) return 'completed';
    if (stepIndex === activeStep) return 'active';
    return 'upcoming';
  };

  const handleStepClick = (index: number) => {
    setActiveStep(index);
  };

  return (
    <>
      {/* Info Icon */}
      {showIcon && (
        <div className="fixed top-4 right-20 z-40">
          <button 
            onClick={onToggle}
            className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-2 border-blue-200 hover:border-blue-400"
            title="איך עובד התהליך הלימודי?"
          >
            <FaInfoCircle className="text-blue-600 text-xl" />
          </button>
        </div>
      )}

      {/* Overlay */}
      {isVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto" dir="rtl">
            {/* Google Font */}
            <style jsx global>{`
              @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap');
              .learning-guide {
                font-family: 'Rubik', sans-serif;
              }
            `}</style>

            <div className="learning-guide">
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 rounded-t-2xl relative">
                <button 
                  onClick={onToggle}
                  className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center hover:bg-opacity-30 transition-colors"
                >
                  <FaTimes className="text-white" />
                </button>
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-2">איך עובד התהליך הלימודי?</h2>
                  <p className="text-lg opacity-90">עבור את 4 השלבים כדי לשלוט בנושא שבחרת</p>
                </div>
              </div>

              <div className="p-6">
                {/* Steps Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {steps.map((step, index) => {
                    const status = getStepStatus(index);
                    return (
                      <div
                        key={step.id}
                        onClick={() => handleStepClick(index)}
                        className={`relative cursor-pointer transform transition-all duration-300 hover:scale-105 ${
                          status === 'active' ? 'ring-2 ring-orange-400 ring-opacity-50' : ''
                        }`}
                      >
                        <div className={`bg-white rounded-xl p-4 shadow-md border-2 ${
                          status === 'completed' 
                            ? 'border-green-400 bg-green-50' 
                            : status === 'active' 
                              ? 'border-orange-400 bg-orange-50' 
                              : 'border-gray-200'
                        }`}>
                          
                          {/* Step Number & Arrow */}
                          <div className="flex justify-between items-start mb-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                              status === 'completed' ? 'bg-green-500' : step.color
                            }`}>
                              {status === 'completed' ? <FaCheck className="text-xs" /> : step.id}
                            </div>
                            
                            {index < steps.length - 1 && (
                              <FaArrowRight className="text-gray-400 text-sm mt-1" />
                            )}
                          </div>

                          {/* Icon */}
                          <div className={`${step.color} w-12 h-12 rounded-full flex items-center justify-center text-white mb-3 mx-auto`}>
                            {step.icon}
                          </div>

                          {/* Title */}
                          <h3 className="text-lg font-bold text-gray-800 text-center mb-2">
                            {step.title}
                          </h3>

                          {/* Description */}
                          <p className="text-gray-600 text-center text-sm mb-3">
                            {step.description}
                          </p>

                          {/* Requirement */}
                          <div className={`text-xs text-center p-2 rounded-lg ${
                            step.minScore 
                              ? 'bg-orange-100 text-orange-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {step.requirement}
                            {step.minScore && (
                              <div className="font-bold mt-1">{step.minScore}</div>
                            )}
                          </div>

                          {/* Status Badge */}
                          {status === 'completed' && (
                            <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-1">
                              <FaCheck className="text-xs" />
                            </div>
                          )}
                          
                          {status === 'active' && (
                            <div className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full p-1 animate-pulse">
                              <FaPlay className="text-xs" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Detailed View */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`${steps[activeStep].color} w-12 h-12 rounded-full flex items-center justify-center text-white`}>
                      {steps[activeStep].icon}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">
                        {steps[activeStep].title}
                      </h3>
                      <p className="text-lg text-gray-600">
                        {steps[activeStep].description}
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Details */}
                    <div>
                      <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FaStar className="text-yellow-500" />
                        מה קורה בשלב הזה?
                      </h4>
                      <ul className="space-y-2">
                        {steps[activeStep].details.map((detail, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                            </div>
                            <span className="text-gray-700 text-sm">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Requirements */}
                    <div>
                      <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FaCheck className="text-green-500" />
                        דרישות להמשך
                      </h4>
                      <div className="bg-white rounded-lg p-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl mb-2">
                            {steps[activeStep].minScore ? '📊' : '✅'}
                          </div>
                          <div className="text-base font-semibold text-gray-800 mb-2">
                            {steps[activeStep].requirement}
                          </div>
                          {steps[activeStep].minScore && (
                            <div className="text-xl font-bold text-orange-600">
                              {steps[activeStep].minScore}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tips */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h5 className="font-bold text-blue-800 mb-2">💡 טיפ:</h5>
                        <p className="text-blue-700 text-sm">
                          {activeStep === 0 && "קח את הזמן שלך ללמוד כל מילה היטב. גם אם אתה מכיר מילה, עדיין כדאי לעבור עליה כדי לחזק את הזיכרון."}
                          {activeStep === 1 && "אם לא עברת את הבוחן בפעם הראשונה, אל תדאג! חזור לכרטיסיות, חזור על המילים ונסה שוב."}
                          {activeStep === 2 && "כתוב תגובה אמיתית ומחשובה. ככל שהתגובה תהיה יותר מפורטת ומעניינת, כך תקבל משוב טוב יותר."}
                          {activeStep === 3 && "דבר בטבעיות ואל תפחד מטעויות. המערכת כאן כדי לעזור לך להשתפר, לא לשפוט אותך."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => activeStep > 0 && setActiveStep(activeStep - 1)}
                      disabled={activeStep === 0}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                        activeStep === 0
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-500 text-white hover:bg-gray-600'
                      }`}
                    >
                      שלב קודם
                    </button>

                    <div className="text-center">
                      <span className="text-gray-500 text-sm">
                        שלב {activeStep + 1} מתוך {steps.length}
                      </span>
                    </div>

                    <button
                      onClick={() => activeStep < steps.length - 1 && setActiveStep(activeStep + 1)}
                      disabled={activeStep === steps.length - 1}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                        activeStep === steps.length - 1
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-orange-500 text-white hover:bg-orange-600'
                      }`}
                    >
                      שלב הבא
                    </button>
                  </div>
                </div>

                {/* Call to Action */}
                <div className="text-center mt-6">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-6">
                    <h3 className="text-xl font-bold mb-2">מוכן להתחיל?</h3>
                    <p className="mb-4">בחר נושא ותתחיל את המסע הלימודי שלך עכשיו!</p>
                    <button 
                      onClick={onToggle}
                      className="bg-white text-orange-600 px-6 py-2 rounded-lg font-bold hover:bg-orange-50 transition-colors"
                    >
                      התחל ללמוד
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LearningProcessGuide;