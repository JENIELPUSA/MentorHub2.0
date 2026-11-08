import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { DepartmentProvider } from "./contexts/DepartmentContext/DepartmentContext.jsx";
import { UserDisplayProvider } from "./contexts/UserManagementContext/UserManagementContext.jsx";
import { StudentProvider } from "./contexts/StudentContext/StudentContext.jsx";
import { SubjectProvider } from "./contexts/SubjectContext/SubjectContext.jsx";
import { SectionProvider } from "./contexts/SectionContext/SectionContext.jsx";
import { GroupProvider } from "./contexts/GroupNameContext/GroupNameContext.jsx";
import { ProposedTitleProvider } from "./contexts/ProposedTitleContext/ProposedTitleContext.jsx";
import { StatisticalProvider } from "./contexts/StatisticalContext/StatisticalContext.jsx";
import { NotificationProvider } from "./contexts/NotificationContext/NotificationContext.jsx";
import { CommentProvider } from "./contexts/CommentContext/CommentContext.jsx";
import { ScheduleProvider } from "./contexts/ScheduleContext/ScheduleContext.jsx";
import { FormatProvider } from "./contexts/FormatContext/FormatContext.jsx";
import SocketListener from "./components/SocketListener/SocketListener.jsx"; // adjust path

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <FormatProvider>
        <ScheduleProvider>
          <CommentProvider>
            <NotificationProvider>
              <StatisticalProvider>
                <ProposedTitleProvider>
                  <GroupProvider>
                    <SectionProvider>
                      <DepartmentProvider>
                        <UserDisplayProvider>
                          <SubjectProvider>
                            <StudentProvider>
                              {/* ✅ Listener dito — may access sa lahat ng contexts */}
                              <SocketListener />
                              <App />
                            </StudentProvider>
                          </SubjectProvider>
                        </UserDisplayProvider>
                      </DepartmentProvider>
                    </SectionProvider>
                  </GroupProvider>
                </ProposedTitleProvider>
              </StatisticalProvider>
            </NotificationProvider>
          </CommentProvider>
        </ScheduleProvider>
      </FormatProvider>
    </AuthProvider>
  </StrictMode>
);