"use client";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease" | "neutral";
  };
  icon: React.ReactNode;
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "indigo";
  description?: string;
}

const colorClasses = {
  blue: {
    bg: "bg-blue-500",
    text: "text-blue-600",
    bgLight: "bg-blue-50",
    textLight: "text-blue-500",
  },
  green: {
    bg: "bg-green-500",
    text: "text-green-600",
    bgLight: "bg-green-50",
    textLight: "text-green-500",
  },
  yellow: {
    bg: "bg-yellow-500",
    text: "text-yellow-600",
    bgLight: "bg-yellow-50",
    textLight: "text-yellow-500",
  },
  red: {
    bg: "bg-red-500",
    text: "text-red-600",
    bgLight: "bg-red-50",
    textLight: "text-red-500",
  },
  purple: {
    bg: "bg-purple-500",
    text: "text-purple-600",
    bgLight: "bg-purple-50",
    textLight: "text-purple-500",
  },
  indigo: {
    bg: "bg-indigo-500",
    text: "text-indigo-600",
    bgLight: "bg-indigo-50",
    textLight: "text-indigo-500",
  },
};

export default function StatsCard({
  title,
  value,
  change,
  icon,
  color = "blue",
  description,
}: StatsCardProps) {
  const colors = colorClasses[color];

  const getChangeIcon = () => {
    if (!change) return null;

    switch (change.type) {
      case "increase":
        return (
          <svg
            className="w-4 h-4 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 17l9.2-9.2M17 17V7H7"
            />
          </svg>
        );
      case "decrease":
        return (
          <svg
            className="w-4 h-4 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 7l-9.2 9.2M7 7v10h10"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12H4"
            />
          </svg>
        );
    }
  };

  const getChangeTextColor = () => {
    if (!change) return "text-gray-500";

    switch (change.type) {
      case "increase":
        return "text-green-600";
      case "decrease":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div
              className={`w-8 h-8 ${colors.bg} rounded-md flex items-center justify-center`}
            >
              <div className="text-white">{icon}</div>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {value}
                </div>
                {change && (
                  <div
                    className={`ml-2 flex items-baseline text-sm font-semibold ${getChangeTextColor()}`}
                  >
                    {getChangeIcon()}
                    <span className="ml-1">{Math.abs(change.value)}%</span>
                  </div>
                )}
              </dd>
              {description && (
                <dd className="text-xs text-gray-500 mt-1">{description}</dd>
              )}
            </dl>
          </div>
        </div>
      </div>

      {change && (
        <div className={`${colors.bgLight} px-5 py-3`}>
          <div className="text-sm">
            <span className={`font-medium ${colors.textLight}`}>
              {change.type === "increase" && "전월 대비 증가"}
              {change.type === "decrease" && "전월 대비 감소"}
              {change.type === "neutral" && "전월 대비 동일"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
