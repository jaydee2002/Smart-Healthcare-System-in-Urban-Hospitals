const emailTemplate = (
  reportType,
  department,
  serviceType,
  patientType,
  status,
  dateStr
) => `
  <div style="
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f4f7fb;
    padding: 30px;
  ">
    <div style="
      max-width: 600px;
      background-color: #ffffff;
      margin: 0 auto;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    ">
      <div style="background-color: #2563eb; color: white; padding: 20px 25px;">
        <h2 style="margin: 0; font-size: 22px;">📊 Report Schedule Confirmation</h2>
      </div>

      <div style="padding: 25px;">
        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hello <strong>Manager</strong>,</p>

        <p style="font-size: 15px; color: #555;">
          You have successfully scheduled a <strong style="color: #2563eb;">${reportType}</strong> report.  
          Below are the details of your scheduled report:
        </p>

        <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: bold;">Department:</td>
            <td style="padding: 8px 0; color: #333;">${department || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: bold;">Service Type:</td>
            <td style="padding: 8px 0; color: #333;">${
              serviceType || "N/A"
            }</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: bold;">Patient Type:</td>
            <td style="padding: 8px 0; color: #333;">${
              patientType || "N/A"
            }</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: bold;">Status:</td>
            <td style="padding: 8px 0; color: #333;">${status || "Pending"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-weight: bold;">Scheduled Date & Time:</td>
            <td style="padding: 8px 0; color: #333;">${dateStr}</td>
          </tr>
        </table>

        <div style="margin-top: 25px; padding: 15px; background-color: #f0f4ff; border-left: 4px solid #2563eb; border-radius: 6px;">
          <p style="margin: 0; font-size: 14px; color: #444;">
            🕒 You will receive the report automatically at the scheduled time.
          </p>
        </div>

        <p style="font-size: 14px; color: #777; margin-top: 30px;">
          If this schedule was not created by you, please contact your administrator immediately.
        </p>

        <p style="font-size: 15px; color: #333; margin-top: 25px;">
          — <strong>Hospital Report System</strong><br/>
          <span style="color: #2563eb;">Empowering smarter healthcare decisions.</span>
        </p>
      </div>

      <div style="background-color: #f8fafc; text-align: center; padding: 15px;">
        <p style="font-size: 13px; color: #999; margin: 0;">
          © ${new Date().getFullYear()} Hospital Report System. All rights reserved.
        </p>
      </div>
    </div>
  </div>
`;
export default emailTemplate;
