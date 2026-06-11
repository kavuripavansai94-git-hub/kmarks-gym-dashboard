import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AppContext = createContext();

const initialMembers = [
  {
    id: "M001",
    name: "Marcus Aurelius",
    phone: "555-0123",
    email: "marcus@rome.gov",
    plan: "Pro Athlete Yearly",
    trainer: "C. Bumstead",
    joinDate: "2023-10-20",
    expiryDate: "2024-10-20",
    status: "Active",
    profileImg: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200&auto=format&fit=crop"
  },
  {
    id: "M002",
    name: "Sarah Connor",
    phone: "555-0456",
    email: "sconnor@cyberdyne.net",
    plan: "Strength Elite",
    trainer: "Linda H.",
    joinDate: "2023-10-18",
    expiryDate: "2024-10-18",
    status: "Active",
    profileImg: "https://images.unsplash.com/photo-1548690312-e3b507d8c110?q=80&w=200&auto=format&fit=crop"
  },
  {
    id: "M003",
    name: "John Wick",
    phone: "555-0789",
    email: "babayaga@continental.org",
    plan: "Standard Monthly",
    trainer: "Self-Trained",
    joinDate: "2023-10-15",
    expiryDate: "2023-11-15",
    status: "Expired",
    profileImg: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop"
  },
  {
    id: "M004",
    name: "Ripley Ellen",
    phone: "555-0999",
    email: "ripley@weyland-yutani.com",
    plan: "Survivalist 30",
    trainer: "Hicks Dwayne",
    joinDate: "2023-10-12",
    expiryDate: "2023-11-11",
    status: "Expiring Soon",
    profileImg: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=200&auto=format&fit=crop"
  }
];

const initialTrainers = [
  {
    id: "T001",
    name: "Marcus Thorne",
    phone: "+1 (555) 234-8891",
    specialty: "Bodybuilding",
    joinedDate: "2023-01-12",
    assignedMembers: 24,
    rating: 4.9,
    certs: "IFBB Pro, NASM-CPT",
    role: "Senior Coach",
    profileImg: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=200&auto=format&fit=crop"
  },
  {
    id: "T002",
    name: "Sarah Chen",
    phone: "+1 (555) 902-1143",
    specialty: "High Intensity",
    joinedDate: "2023-03-05",
    assignedMembers: 18,
    rating: 4.8,
    certs: "ACE-GFI, FMS Level 1",
    role: "HIIT Lead",
    profileImg: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop"
  },
  {
    id: "T003",
    name: "Elena Rodriguez",
    phone: "+1 (555) 441-0092",
    specialty: "Yoga / Mobility",
    joinedDate: "2023-06-20",
    assignedMembers: 12,
    rating: 5.0,
    certs: "RYT-500, FRC Specialist",
    role: "Yoga & Mobility",
    profileImg: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop"
  },
  {
    id: "T004",
    name: "David Kowalski",
    phone: "+1 (555) 772-4011",
    specialty: "Strength",
    joinedDate: "2023-08-15",
    assignedMembers: 15,
    rating: 4.9,
    certs: "USAPL Coach, CSCS",
    role: "Powerlifting",
    profileImg: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop"
  }
];

const initialPayments = [
  {
    id: "TXN101",
    memberName: "Marcus Aurelius",
    amount: 1200,
    date: "2023-10-20",
    status: "Paid",
    plan: "Pro Athlete Yearly"
  },
  {
    id: "TXN102",
    memberName: "Sarah Connor",
    amount: 150,
    date: "2023-10-18",
    status: "Paid",
    plan: "Strength Elite"
  },
  {
    id: "TXN103",
    memberName: "John Wick",
    amount: 80,
    date: "2023-09-15",
    status: "Overdue",
    plan: "Standard Monthly"
  },
  {
    id: "TXN104",
    memberName: "Ripley Ellen",
    amount: 100,
    date: "2023-10-12",
    status: "Pending",
    plan: "Survivalist 30"
  }
];

const initialAttendance = [
  {
    memberName: "Marcus Aurelius",
    time: "07:34 AM",
    status: "Checked In",
    plan: "Pro Athlete Yearly",
    trainer: "C. Bumstead",
    profileImg: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200&auto=format&fit=crop"
  },
  {
    memberName: "Sarah Connor",
    time: "08:15 AM",
    status: "Checked In",
    plan: "Strength Elite",
    trainer: "Linda H.",
    profileImg: "https://images.unsplash.com/photo-1548690312-e3b507d8c110?q=80&w=200&auto=format&fit=crop"
  },
  {
    memberName: "Ripley Ellen",
    time: "09:42 AM",
    status: "Checked In",
    plan: "Survivalist 30",
    trainer: "Hicks Dwayne",
    profileImg: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=200&auto=format&fit=crop"
  }
];

const initialAnnouncements = [
  {
    id: "A001",
    title: "New Heavy Dumbbells Installed",
    content: "We have added pairs up to 150lbs in the main free weight area. Go heavy or go home!",
    date: "2023-10-22",
    status: "Active",
    type: "Email & SMS"
  },
  {
    id: "A002",
    title: "Holiday Squat Clinic",
    content: "Join Coach David Kowalski on Nov 10th for an intense 2-hour breakdown of squat mechanics.",
    date: "2023-10-24",
    status: "Scheduled",
    type: "Email"
  },
  {
    id: "A003",
    title: "Gym Maintenance Notice",
    content: "The cardio section will be closed for equipment calibration on Sunday from 2PM to 5PM.",
    date: "2023-10-15",
    status: "Active",
    type: "SMS"
  }
];

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('kmarks_admin_user');
    return stored ? JSON.parse(stored) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');

  const [members, setMembers] = useState(() => {
    const stored = localStorage.getItem('kmarks_members');
    return stored ? JSON.parse(stored) : initialMembers;
  });

  const [trainers, setTrainers] = useState(() => {
    const stored = localStorage.getItem('kmarks_trainers');
    return stored ? JSON.parse(stored) : initialTrainers;
  });

  const [payments, setPayments] = useState(() => {
    const stored = localStorage.getItem('kmarks_payments');
    return stored ? JSON.parse(stored) : initialPayments;
  });

  const [attendance, setAttendance] = useState(() => {
    const stored = localStorage.getItem('kmarks_attendance');
    return stored ? JSON.parse(stored) : initialAttendance;
  });

  const [announcements, setAnnouncements] = useState(() => {
    const stored = localStorage.getItem('kmarks_announcements');
    return stored ? JSON.parse(stored) : initialAnnouncements;
  });

  useEffect(() => {
    localStorage.setItem('kmarks_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('kmarks_trainers', JSON.stringify(trainers));
  }, [trainers]);

  useEffect(() => {
    localStorage.setItem('kmarks_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('kmarks_attendance', JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem('kmarks_announcements', JSON.stringify(announcements));
  }, [announcements]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token, user: loggedInUser } = response.data;
      setUser(loggedInUser);
      localStorage.setItem('kmarks_jwt_token', token);
      localStorage.setItem('kmarks_admin_user', JSON.stringify(loggedInUser));
      return { success: true };
    } catch (error) {
      console.error("Login failed:", error);
      return { 
        success: false, 
        error: error.response?.data?.error || "Invalid credentials." 
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kmarks_jwt_token');
    localStorage.removeItem('kmarks_admin_user');
  };

  const addMember = (member) => {
    const newMember = {
      ...member,
      id: `M00${members.length + 1}`,
      profileImg: member.profileImg || "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop"
    };
    setMembers([newMember, ...members]);
    
    // Also record a payment for the new member based on plan
    let amount = 100;
    if (member.plan.includes("Yearly") || member.plan.includes("Elite")) {
      amount = member.plan.includes("Yearly") ? 1200 : 150;
    }
    const newPayment = {
      id: `TXN${100 + payments.length + 1}`,
      memberName: member.name,
      amount,
      date: member.joinDate,
      status: "Paid",
      plan: member.plan
    };
    setPayments([newPayment, ...payments]);
  };

  const editMember = (id, updatedMember) => {
    setMembers(members.map(m => m.id === id ? { ...m, ...updatedMember } : m));
  };

  const deleteMember = (id) => {
    setMembers(members.filter(m => m.id !== id));
  };

  const addTrainer = (trainer) => {
    const newTrainer = {
      ...trainer,
      id: `T00${trainers.length + 1}`,
      assignedMembers: 0,
      rating: 5.0,
      profileImg: trainer.profileImg || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop"
    };
    setTrainers([...trainers, newTrainer]);
  };

  const addPayment = (payment) => {
    const newPayment = {
      ...payment,
      id: `TXN${100 + payments.length + 1}`,
    };
    setPayments([newPayment, ...payments]);

    // Recalculate member status if status is Paid
    if (payment.status === "Paid") {
      const member = members.find(m => m.name.toLowerCase() === payment.memberName.toLowerCase());
      if (member) {
        editMember(member.id, { status: "Active" });
      }
    }
  };

  const addAnnouncement = (announcement) => {
    const newAnn = {
      ...announcement,
      id: `A00${announcements.length + 1}`,
    };
    setAnnouncements([newAnn, ...announcements]);
  };

  const checkInMember = (memberName) => {
    const member = members.find(m => m.name.toLowerCase() === memberName.toLowerCase());
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const newCheckIn = {
      memberName: member ? member.name : memberName,
      time: timeStr,
      status: "Checked In",
      plan: member ? member.plan : "Standard Monthly",
      trainer: member ? member.trainer : "Self-Trained",
      profileImg: member ? member.profileImg : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop"
    };
    setAttendance([newCheckIn, ...attendance]);
  };

  return (
    <AppContext.Provider value={{
      user,
      activeTab,
      setActiveTab,
      members,
      trainers,
      payments,
      attendance,
      announcements,
      login,
      logout,
      addMember,
      editMember,
      deleteMember,
      addTrainer,
      addPayment,
      addAnnouncement,
      checkInMember
    }}>
      {children}
    </AppContext.Provider>
  );
};
