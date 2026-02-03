document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Remove previously-added options (keep the placeholder)
      activitySelect.querySelectorAll('option:not([value=""])').forEach(o => o.remove());

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Build participants section
        const participantsDiv = document.createElement('div');
        participantsDiv.className = 'participants';

        if (details.participants && details.participants.length > 0) {
          const title = document.createElement('p');
          title.className = 'participants-title';
          title.innerHTML = '<strong>Participants:</strong>';
          participantsDiv.appendChild(title);

          const ul = document.createElement('ul');
          details.participants.forEach((p) => {
            const li = document.createElement('li');
            li.className = 'participant-item';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'participant-name';
            nameSpan.textContent = p;

            const btn = document.createElement('button');
            btn.className = 'participant-remove';
            btn.type = 'button';
            btn.title = 'Remove participant';
            btn.setAttribute('aria-label', `Remove ${p}`);
            btn.innerHTML = '&times;';

            btn.addEventListener('click', async () => {
              try {
                const res = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(p)}`,
                  { method: 'DELETE' }
                );
                const json = await res.json().catch(() => ({}));
                if (res.ok) {
                  messageDiv.textContent = json.message || 'Participant removed';
                  messageDiv.className = 'success';
                  messageDiv.classList.remove('hidden');
                  setTimeout(() => messageDiv.classList.add('hidden'), 5000);
                  // Refresh the list to reflect removal
                  fetchActivities();
                } else {
                  messageDiv.textContent = json.detail || 'Failed to remove participant';
                  messageDiv.className = 'error';
                  messageDiv.classList.remove('hidden');
                }
              } catch (err) {
                console.error('Error removing participant:', err);
                messageDiv.textContent = 'Error removing participant';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
              }
            });

            li.appendChild(nameSpan);
            li.appendChild(btn);
            ul.appendChild(li);
          });
          participantsDiv.appendChild(ul);
        } else {
          const none = document.createElement('p');
          none.className = 'no-participants';
          none.textContent = 'No participants yet';
          participantsDiv.appendChild(none);
        }

        activityCard.appendChild(participantsDiv);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities to show the newly-registered participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
