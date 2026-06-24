import streamlit as st
import numpy as np
import matplotlib.pyplot as plt
import time

st.set_page_config(layout="wide")
st.title("Hospital Patient Flow Simulation")
st.markdown("<h5>Dannar Zharkyn</h5>", unsafe_allow_html=True)

st.sidebar.header("Simulation Settings")

sim_hours = st.sidebar.slider("Simulation time (hours)", 1, 24, 8)
animation_speed = st.sidebar.slider("Animation speed", 0.01, 0.30, 0.05)

base_lambda = st.sidebar.slider("Baseline arrival rate λ (patients/hour)", 1.0, 30.0, 10.0)

use_time_varying = st.sidebar.checkbox("Use time-varying arrivals", value=True)

info_workers = st.sidebar.slider("Information desk workers", 1, 5, 2)
nurse_workers = st.sidebar.slider("Nurses", 1, 5, 2)
doctor_workers = st.sidebar.slider("Doctors", 1, 5, 2)

info_time = st.sidebar.slider("Info desk service time (minutes)", 1.0, 10.0, 3.0)
nurse_time = st.sidebar.slider("Nurse service time (minutes)", 3.0, 20.0, 7.0)
doctor_time = st.sidebar.slider("Doctor service time (minutes)", 5.0, 30.0, 12.0)

p_leave_info = st.sidebar.slider("Dropout after information desk", 0.0, 0.8, 0.2)
p_leave_nurse = st.sidebar.slider("Dropout after nurse", 0.0, 0.8, 0.5)

run = st.button("Run Simulation")


def arrival_multiplier(hour):
    hour = hour % 24

    if 0 <= hour < 4:
        return 0.60
    elif 4 <= hour < 8:
        return 0.72
    elif 8 <= hour < 12:
        return 1.00
    elif 12 <= hour < 16:
        return 1.28
    elif 16 <= hour < 20:
        return 1.12
    else:
        return 0.80


def get_patient(patients, pid):
    for p in patients:
        if p["id"] == pid:
            return p
    return None


if run:
    placeholder = st.empty()

    dt = 1 / 60      # one minute in hours
    steps = int(sim_hours / dt)

    x_entry = 0
    x_info = 3
    x_nurse = 7
    x_doctor = 11
    x_exit = 14

    speed = 0.35

    patients = []
    next_id = 0

    q_info = []
    q_nurse = []
    q_doctor = []

    info_servers = [None] * info_workers
    nurse_servers = [None] * nurse_workers
    doctor_servers = [None] * doctor_workers

    completed = 0
    left_info = 0
    left_nurse = 0

    wait_info = []
    wait_nurse = []
    wait_doctor = []

    rng = np.random.default_rng()
    # history for plots
    time_history = []
    lambda_history = []
    q_info_history = []
    q_nurse_history = []
    q_doctor_history = []

    for step in range(steps):
        t = step * dt
        current_hour = t % 24

        if use_time_varying:
            lam = base_lambda * arrival_multiplier(current_hour)
        else:
            lam = base_lambda
        # save history for plots
        time_history.append(t)
        lambda_history.append(lam)
        q_info_history.append(len(q_info))
        q_nurse_history.append(len(q_nurse))
        q_doctor_history.append(len(q_doctor))

        # arrivals
        arrivals = rng.poisson(lam * dt)

        for _ in range(arrivals):
            patients.append({
                "id": next_id,
                "stage": "to_info",
                "x": x_entry,
                "y": 0,
                "queue_enter_time": t,
                "service_done_time": None
            })
            next_id += 1

        # move to info queue
        for p in patients:
            if p["stage"] == "to_info":
                p["x"] += speed
                if p["x"] >= x_info - 1.0:
                    p["stage"] = "q_info"
                    p["queue_enter_time"] = t
                    q_info.append(p["id"])

        # assign info desk
        for s in range(info_workers):
            if info_servers[s] is None and len(q_info) > 0:
                pid = q_info.pop(0)
                p = get_patient(patients, pid)
                if p is not None:
                    info_servers[s] = pid
                    p["stage"] = "serving_info"
                    wait_info.append(t - p["queue_enter_time"])
                    service_time = rng.exponential(info_time / 60)
                    p["service_done_time"] = t + service_time

        # complete info desk
        for s, pid in enumerate(info_servers):
            if pid is not None:
                p = get_patient(patients, pid)
                if p is not None and t >= p["service_done_time"]:
                    info_servers[s] = None
                    if rng.random() < p_leave_info:
                        p["stage"] = "left"
                        left_info += 1
                    else:
                        p["stage"] = "to_nurse"
                        p["x"] = x_info + 0.5
                        p["queue_enter_time"] = t

        # move to nurse queue
        for p in patients:
            if p["stage"] == "to_nurse":
                p["x"] += speed
                if p["x"] >= x_nurse - 1.0:
                    p["stage"] = "q_nurse"
                    p["queue_enter_time"] = t
                    q_nurse.append(p["id"])

        # assign nurse
        for s in range(nurse_workers):
            if nurse_servers[s] is None and len(q_nurse) > 0:
                pid = q_nurse.pop(0)
                p = get_patient(patients, pid)
                if p is not None:
                    nurse_servers[s] = pid
                    p["stage"] = "serving_nurse"
                    wait_nurse.append(t - p["queue_enter_time"])
                    service_time = rng.exponential(nurse_time / 60)
                    p["service_done_time"] = t + service_time

        # complete nurse
        for s, pid in enumerate(nurse_servers):
            if pid is not None:
                p = get_patient(patients, pid)
                if p is not None and t >= p["service_done_time"]:
                    nurse_servers[s] = None
                    if rng.random() < p_leave_nurse:
                        p["stage"] = "left"
                        left_nurse += 1
                    else:
                        p["stage"] = "to_doctor"
                        p["x"] = x_nurse + 0.5
                        p["queue_enter_time"] = t

        # move to doctor queue
        for p in patients:
            if p["stage"] == "to_doctor":
                p["x"] += speed
                if p["x"] >= x_doctor - 1.0:
                    p["stage"] = "q_doctor"
                    p["queue_enter_time"] = t
                    q_doctor.append(p["id"])

        # assign doctor
        for s in range(doctor_workers):
            if doctor_servers[s] is None and len(q_doctor) > 0:
                pid = q_doctor.pop(0)
                p = get_patient(patients, pid)
                if p is not None:
                    doctor_servers[s] = pid
                    p["stage"] = "serving_doctor"
                    wait_doctor.append(t - p["queue_enter_time"])
                    service_time = rng.exponential(doctor_time / 60)
                    p["service_done_time"] = t + service_time

        # complete doctor
        for s, pid in enumerate(doctor_servers):
            if pid is not None:
                p = get_patient(patients, pid)
                if p is not None and t >= p["service_done_time"]:
                    doctor_servers[s] = None
                    p["stage"] = "finished"
                    completed += 1

        # visual queue positions
        for idx, pid in enumerate(q_info):
            p = get_patient(patients, pid)
            if p:
                p["x"] = x_info - 1.0 - 0.18 * idx
                p["y"] = -0.15

        for idx, pid in enumerate(q_nurse):
            p = get_patient(patients, pid)
            if p:
                p["x"] = x_nurse - 1.0 - 0.18 * idx
                p["y"] = -0.15

        for idx, pid in enumerate(q_doctor):
            p = get_patient(patients, pid)
            if p:
                p["x"] = x_doctor - 1.0 - 0.18 * idx
                p["y"] = -0.15

        # server positions
        for i, pid in enumerate(info_servers):
            p = get_patient(patients, pid) if pid is not None else None
            if p:
                p["x"] = x_info
                p["y"] = 0.45 - 0.35 * i

        for i, pid in enumerate(nurse_servers):
            p = get_patient(patients, pid) if pid is not None else None
            if p:
                p["x"] = x_nurse
                p["y"] = 0.55 - 0.35 * i

        for i, pid in enumerate(doctor_servers):
            p = get_patient(patients, pid) if pid is not None else None
            if p:
                p["x"] = x_doctor
                p["y"] = 0.45 - 0.35 * i

        # plot animation frame
        fig, ax = plt.subplots(figsize=(13, 5))
        ax.set_xlim(-1, 15)
        ax.set_ylim(-2.2, 2.2)
        ax.axis("off")

        ax.plot([x_entry, x_exit], [0, 0], linestyle="--", linewidth=1)

        # boxes
        ax.add_patch(plt.Rectangle((x_info - 0.65, -0.8), 1.3, 1.6, fill=False, linewidth=2))
        ax.add_patch(plt.Rectangle((x_nurse - 0.65, -0.8), 1.3, 1.6, fill=False, linewidth=2))
        ax.add_patch(plt.Rectangle((x_doctor - 0.65, -0.8), 1.3, 1.6, fill=False, linewidth=2))

        ax.text(x_entry, 1.1, "Entry", ha="center", fontsize=11)
        ax.text(x_info, 1.1, "Information Desk", ha="center", fontsize=11)
        ax.text(x_nurse, 1.1, "Nurse", ha="center", fontsize=11)
        ax.text(x_doctor, 1.1, "Doctor", ha="center", fontsize=11)
        ax.text(x_exit, 1.1, "Exit", ha="center", fontsize=11)

        ax.text(x_info, -1.25, f"{info_workers} workers", ha="center", fontsize=10)
        ax.text(x_nurse, -1.25, f"{nurse_workers} nurses", ha="center", fontsize=10)
        ax.text(x_doctor, -1.25, f"{doctor_workers} doctors", ha="center", fontsize=10)

        # arrows
        ax.annotate("", xy=(x_info - 0.8, 0), xytext=(x_entry + 0.4, 0),
                    arrowprops=dict(arrowstyle="->", lw=1.5))
        ax.annotate("", xy=(x_nurse - 0.8, 0), xytext=(x_info + 0.8, 0),
                    arrowprops=dict(arrowstyle="->", lw=1.5))
        ax.annotate("", xy=(x_doctor - 0.8, 0), xytext=(x_nurse + 0.8, 0),
                    arrowprops=dict(arrowstyle="->", lw=1.5))
        ax.annotate("", xy=(x_exit - 0.4, 0), xytext=(x_doctor + 0.8, 0),
                    arrowprops=dict(arrowstyle="->", lw=1.5))

        active = [p for p in patients if p["stage"] not in ["left", "finished"]]
        xs = [p["x"] for p in active]
        ys = [p["y"] for p in active]

        ax.scatter(xs, ys, s=45)

        avg_w1 = np.mean(wait_info) * 60 if wait_info else 0
        avg_w2 = np.mean(wait_nurse) * 60 if wait_nurse else 0
        avg_w3 = np.mean(wait_doctor) * 60 if wait_doctor else 0

        ax.text(
            -0.8,
            1.85,
            f"Time: {t:.2f} hr   Current λ(t): {lam:.2f} patients/hr",
            fontsize=11
        )

        ax.text(
            -0.8,
            1.55,
            f"Queues: Info={len(q_info)} | Nurse={len(q_nurse)} | Doctor={len(q_doctor)}",
            fontsize=11
        )

        ax.text(
            -0.8,
            -1.75,
            f"Finished doctor: {completed} | Left after info: {left_info} | Left after nurse: {left_nurse}",
            fontsize=10
        )

        ax.text(
            6,
            -1.75,
            f"Avg wait (min): Info={avg_w1:.1f}, Nurse={avg_w2:.1f}, Doctor={avg_w3:.1f}",
            fontsize=10
        )

        with placeholder.container():
            col1, col2 = st.columns([2, 1])

            with col1:
                st.pyplot(fig)

            with col2:
                # Arrival rate plot
                fig_lam, ax_lam = plt.subplots(figsize=(5, 2.5))
                ax_lam.plot(time_history, lambda_history, linewidth=2)
                ax_lam.set_title("Arrival Rate Over Time")
                ax_lam.set_xlabel("Time (hours)")
                ax_lam.set_ylabel(r"$\lambda(t)$")
                ax_lam.grid(True)
                st.pyplot(fig_lam)
                plt.close(fig_lam)

                # Queue length plot
                fig_q, ax_q = plt.subplots(figsize=(5, 2.5))
                ax_q.plot(time_history, q_info_history, label="Info")
                ax_q.plot(time_history, q_nurse_history, label="Nurse")
                ax_q.plot(time_history, q_doctor_history, label="Doctor")
                ax_q.set_title("Queue Lengths Over Time")
                ax_q.set_xlabel("Time (hours)")
                ax_q.set_ylabel("Queue Length")
                ax_q.legend()
                ax_q.grid(True)
                st.pyplot(fig_q)
                plt.close(fig_q)

        plt.close(fig)

        time.sleep(animation_speed)
