import React, { useState, useEffect, useCallback } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { EXERCISE_DATABASE } from '../lib/constants';
import { FormField } from './ui/FormField';
import { Plus, Trash2, Edit2, Save, X, ChevronDown, ChevronRight, Copy } from 'lucide-react';
import { OneRepMaxPrompt } from './OneRepMaxPrompt';
import { PlateVisualizer } from './ui/PlateVisualizer';
import { isBarbellExercise } from '../lib/constants';
import { ROUTES } from '../lib/routes';

export const EditProgram = ({ userProfile, onBack, updateUserProfileInFirestore }) => {
    const [localWorkoutPlan, setLocalWorkoutPlan] = useState(null);
    const [expandedDays, setExpandedDays] = useState({});
    const [editingExercise, setEditingExercise] = useState(null); // { dayKey, exerciseIndex, ...data }
    const [addingExerciseDay, setAddingExerciseDay] = useState(null); // dayKey
    const [newExercise, setNewExercise] = useState({
        name: '',
        sets: 3,
        reps: 12,
        percentage: 65,
        bodyPart: 'chest', // default category
        isBodyweight: false,
        customBodyPart: '',
        customName: '',
        isBarbell: true // Default to true for weighted exercises
    });
    const [showOneRepMaxPrompt, setShowOneRepMaxPrompt] = useState(false);
    const [missingExerciseFor1RM, setMissingExerciseFor1RM] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveTemplateModalOpen, setSaveTemplateModalOpen] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [templateDescription, setTemplateDescription] = useState('');
    const [confirmModal, setConfirmModal] = useState({
        open: false,
        title: '',
        message: '',
        onConfirm: null
    });

    useEffect(() => {
        // Only load initial state if local plan is empty
        if (userProfile && userProfile.workoutPlan && !localWorkoutPlan) {
            setLocalWorkoutPlan(JSON.parse(JSON.stringify(userProfile.workoutPlan)));
            // Expand all days by default
            const allDays = {};
            Object.keys(userProfile.workoutPlan).forEach(key => allDays[key] = true);
            setExpandedDays(allDays);
        }
    }, [userProfile, localWorkoutPlan]);

    const toggleDay = (dayKey) => {
        setExpandedDays(prev => ({ ...prev, [dayKey]: !prev[dayKey] }));
    };

    const formatDayKey = (key) => {
        return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    const handleRemoveExercise = (dayKey, index) => {
        setConfirmModal({
            open: true,
            title: 'Remove Exercise',
            message: 'Are you sure you want to remove this exercise?',
            onConfirm: () => {
                setLocalWorkoutPlan(prev => {
                    const newPlan = { ...prev };
                    const newExercises = [...newPlan[dayKey].exercises];
                    newExercises.splice(index, 1);
                    newPlan[dayKey] = { ...newPlan[dayKey], exercises: newExercises };
                    return newPlan;
                });
                setConfirmModal(prev => ({ ...prev, open: false }));
            }
        });
    };

    const handleEditExercise = (dayKey, index, exercise) => {
        // Clone all sets for individual editing
        const clonedSets = exercise.sets.map(set => ({
            reps: set.reps,
            percentage: Math.round((set.percentage || 0) * 100)
        }));

        setEditingExercise({
            dayKey,
            index,
            name: exercise.name,
            oneRepMax: exercise.oneRepMax || 0,
            sets: clonedSets,
            isBarbell: exercise.isBarbell !== undefined ? exercise.isBarbell : isBarbellExercise(exercise.name)
        });
    };

    const handleUpdateExercise = () => {
        if (!editingExercise) return;

        setLocalWorkoutPlan(prev => {
            const newPlan = { ...prev };
            const dayExercises = [...newPlan[editingExercise.dayKey].exercises];
            const existingExercise = dayExercises[editingExercise.index];

            // Build sets from the per-set edit data
            const oneRepMax = editingExercise.oneRepMax || 0;
            const newSets = editingExercise.sets.map(set => {
                const percentage = parseFloat(set.percentage) / 100;
                return {
                    reps: set.reps,
                    percentage: percentage,
                    weight: Math.round((oneRepMax * percentage) / 2.5) * 2.5
                };
            });

            dayExercises[editingExercise.index] = {
                ...existingExercise,
                sets: newSets
            };

            newPlan[editingExercise.dayKey] = { ...newPlan[editingExercise.dayKey], exercises: dayExercises };
            return newPlan;
        });

        setEditingExercise(null);
    };

    const handleSetChange = (setIndex, field, value) => {
        setEditingExercise(prev => {
            const newSets = [...prev.sets];
            newSets[setIndex] = { ...newSets[setIndex], [field]: value };
            return { ...prev, sets: newSets };
        });
    };

    const handleAddSet = () => {
        setEditingExercise(prev => {
            const lastSet = prev.sets[prev.sets.length - 1] || { reps: 12, percentage: 65 };
            return { ...prev, sets: [...prev.sets, { reps: lastSet.reps, percentage: lastSet.percentage }] };
        });
    };

    const handleRemoveSet = (setIndex) => {
        if (editingExercise.sets.length <= 1) return; // Keep at least one set
        setEditingExercise(prev => {
            const newSets = prev.sets.filter((_, i) => i !== setIndex);
            return { ...prev, sets: newSets };
        });
    };

    const handleAddExerciseStart = (dayKey) => {
        setAddingExerciseDay(dayKey);
        setNewExercise({
            name: '',
            sets: 3,
            reps: 12,
            percentage: 65,
            bodyPart: 'chest',
            isBodyweight: false,
            customBodyPart: '',
            customName: '',
            isBarbell: false
        });
    };

    const handleAddExerciseSubmit = () => {
        // Determine final name
        const finalName = newExercise.bodyPart === 'Custom' || newExercise.name === 'Custom'
            ? newExercise.customName
            : newExercise.name;

        if (!finalName) return;

        // If bodyweight, skip library/1RM checks
        if (newExercise.isBodyweight) {
            addExerciseToPlan(0, finalName); // 0 1RM for bodyweight
            return;
        }

        // Check if exercise is in library
        const inLibrary = userProfile.exerciseLibrary.find(e => e.name === finalName);

        if (!inLibrary) {
            // Need to ask for 1RM
            setMissingExerciseFor1RM({
                ...newExercise,
                name: finalName,
                id: finalName.toLowerCase().replace(/\s+/g, '_')
            });
            setShowOneRepMaxPrompt(true);
            return; // Wait for prompt
        }

        addExerciseToPlan(inLibrary.oneRepMax, finalName);
    };

    const addExerciseToPlan = (oneRepMax, exerciseName) => {
        setLocalWorkoutPlan(prev => {
            const newPlan = { ...prev };

            // Deep clone the day object and exercises array to avoid mutation bugs
            const updatedDay = { ...(newPlan[addingExerciseDay] || {}) };
            const updatedExercises = [...(updatedDay.exercises || [])];

            if (!updatedExercises) {
                // Should not happen with the line above, but for safety
                updatedDay.exercises = [];
            }

            const percentage = newExercise.isBodyweight ? 0 : parseFloat(newExercise.percentage) / 100;
            const weight = newExercise.isBodyweight
                ? 0
                : Math.round((oneRepMax * percentage) / 2.5) * 2.5;

            const sets = Array(parseInt(newExercise.sets)).fill(null).map(() => ({
                reps: newExercise.reps,
                percentage: percentage,
                weight: weight
            }));

            // Find exercise type from database
            let type = newExercise.isBodyweight ? 'bodyweight' : 'weighted';
            if (!newExercise.isBodyweight) {
                Object.values(EXERCISE_DATABASE).forEach(list => {
                    const found = list.find(e => e.name === exerciseName);
                    if (found) type = found.type;
                });
            }

            const newExObj = {
                id: exerciseName.toLowerCase().replace(/\s+/g, '_'),
                name: exerciseName,
                type,
                oneRepMax,
                sets,
                isBodyweight: newExercise.isBodyweight,
                isBarbell: newExercise.isBarbell
            };

            updatedExercises.push(newExObj);
            updatedDay.exercises = updatedExercises;
            newPlan[addingExerciseDay] = updatedDay;

            return newPlan;
        });
        setAddingExerciseDay(null);
    };

    const handle1RMSave = async (newExercisesWith1RM) => {
        // Should handle saving 1RM to library too
        if (newExercisesWith1RM.length > 0) {
            const ex = newExercisesWith1RM[0]; // We only added one

            // Update library in firestore immediately so it sticks
            const newLibrary = [...userProfile.exerciseLibrary, ex];
            await updateUserProfileInFirestore({ exerciseLibrary: newLibrary });

            setShowOneRepMaxPrompt(false);
            addExerciseToPlan(ex.oneRepMax, ex.name);
        }
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            await updateUserProfileInFirestore({ workoutPlan: localWorkoutPlan });
            onBack();
        } catch (err) {
            console.error("Error saving plan:", err);
            alert("Failed to save changes.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAsTemplate = () => {
        setSaveTemplateModalOpen(true);
    };

    const confirmSaveTemplate = async () => {
        if (!templateName) return;

        const newTemplate = {
            id: `custom_${Date.now()}`,
            name: templateName,
            description: templateDescription || 'Custom user template',
            structure: 'Custom',
            ...localWorkoutPlan
        };

        const currentCustomTemplates = userProfile.customTemplates || {};
        const updatedCustomTemplates = {
            ...currentCustomTemplates,
            [newTemplate.id]: newTemplate
        };

        setIsSaving(true);
        try {
            await updateUserProfileInFirestore({ customTemplates: updatedCustomTemplates });
            setSaveTemplateModalOpen(false);
            alert('Template saved successfully!');
        } catch (err) {
            console.error("Error saving template:", err);
            alert("Failed to save template.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!localWorkoutPlan) return <div className="text-white p-8">Loading...</div>;

    return (
        <div className="container mx-auto p-4 md:p-8 text-white animate-fade-in pb-20">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Edit Schedule</h1>
                <div className="flex gap-2">
                    <button onClick={handleSaveAsTemplate} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                        <Copy size={18} /> Save as Template
                    </button>
                    <button onClick={onBack} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">
                        Cancel
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {Object.keys(localWorkoutPlan).sort().map(dayKey => (
                    <div key={dayKey} className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
                        <div
                            className="p-4 bg-gray-750 flex justify-between items-center cursor-pointer hover:bg-gray-700 transition"
                            onClick={() => toggleDay(dayKey)}
                        >
                            <h3 className="text-xl font-semibold text-blue-400">{formatDayKey(dayKey)}</h3>
                            {expandedDays[dayKey] ? <ChevronDown /> : <ChevronRight />}
                        </div>

                        {expandedDays[dayKey] && (
                            <div className="p-4 space-y-4">
                                {localWorkoutPlan[dayKey].exercises.map((exercise, index) => (
                                    <div key={`${dayKey}-${index}`} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg">
                                        <div>
                                            <h4 className="font-bold">{exercise.name}</h4>
                                            <p className="text-sm text-gray-400">
                                                {exercise.sets.length} sets x {exercise.sets[0]?.reps} reps @ {Math.round((exercise.sets[0]?.percentage || 0) * 100)}%
                                            </p>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <button
                                                onClick={() => handleEditExercise(dayKey, index, exercise)}
                                                className="w-9 h-9 bg-blue-600 rounded hover:bg-blue-500 text-white flex items-center justify-center"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleRemoveExercise(dayKey, index)}
                                                className="w-9 h-9 bg-red-600 rounded hover:bg-red-500 text-white flex items-center justify-center"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={() => handleAddExerciseStart(dayKey)}
                                    className="w-full py-3 border-2 border-dashed border-gray-600 text-gray-400 rounded-lg hover:border-gray-400 hover:text-white transition flex justify-center items-center gap-2"
                                >
                                    <Plus size={20} /> Add Exercise
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Floating Save Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-800 flex justify-center z-10">
                <button
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-12 rounded-full shadow-lg flex items-center gap-2 text-lg disabled:opacity-50"
                >
                    <Save size={24} /> {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Add Exercise Modal */}
            {addingExerciseDay && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Add Exercise to {formatDayKey(addingExerciseDay)}</h3>
                            <button onClick={() => setAddingExerciseDay(null)}><X size={24} /></button>
                        </div>

                        <div className="space-y-4">
                            <FormField label="Body Part" type="select" value={newExercise.bodyPart} onChange={e => setNewExercise({ ...newExercise, bodyPart: e.target.value, name: '' })}>
                                {Object.keys(EXERCISE_DATABASE).map(part => <option key={part} value={part}>{part.charAt(0).toUpperCase() + part.slice(1)}</option>)}
                                <option value="Custom">Custom</option>
                            </FormField>

                            {newExercise.bodyPart === 'Custom' && (
                                <FormField label="Custom Body Part" type="text" placeholder="e.g. Core" value={newExercise.customBodyPart} onChange={e => setNewExercise({ ...newExercise, customBodyPart: e.target.value })} />
                            )}

                            {newExercise.bodyPart !== 'Custom' ? (
                                <FormField label="Exercise" type="select" value={newExercise.name} onChange={e => setNewExercise({ ...newExercise, name: e.target.value })}>
                                    <option value="">Select Exercise</option>
                                    {EXERCISE_DATABASE[newExercise.bodyPart]?.map(ex => (
                                        <option key={ex.name} value={ex.name}>{ex.name}</option>
                                    ))}
                                    <option value="Custom">Custom</option>
                                </FormField>
                            ) : null}

                            {(newExercise.bodyPart === 'Custom' || newExercise.name === 'Custom') && (
                                <FormField label="Custom Exercise Name" type="text" placeholder="e.g. Plank" value={newExercise.customName} onChange={e => setNewExercise({ ...newExercise, customName: e.target.value })} />
                            )}

                            <label className="flex items-center gap-2 cursor-pointer bg-gray-700/50 p-2 rounded">
                                <input
                                    type="checkbox"
                                    checked={newExercise.isBodyweight}
                                    onChange={e => setNewExercise({ ...newExercise, isBodyweight: e.target.checked })}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-600 ring-offset-gray-800 bg-gray-700 border-gray-600"
                                />
                                <span className="text-white select-none">Bodyweight Only (No %)</span>
                            </label>

                            {!newExercise.isBodyweight && (
                                <label className="flex items-center gap-2 cursor-pointer bg-gray-700/50 p-2 rounded">
                                    <input
                                        type="checkbox"
                                        checked={newExercise.isBarbell}
                                        onChange={e => setNewExercise({ ...newExercise, isBarbell: e.target.checked })}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-600 ring-offset-gray-800 bg-gray-700 border-gray-600"
                                    />
                                    <span className="text-white select-none">Barbell Exercise (Show Plate Math)</span>
                                </label>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                <FormField label="Sets" type="number" value={newExercise.sets} onChange={e => setNewExercise({ ...newExercise, sets: e.target.value })} />
                                <FormField label="Reps" type="text" value={newExercise.reps} onChange={e => setNewExercise({ ...newExercise, reps: e.target.value })} />
                            </div>

                            {!newExercise.isBodyweight && (
                                <FormField label="%" type="number" value={newExercise.percentage} onChange={e => setNewExercise({ ...newExercise, percentage: e.target.value })} />
                            )}

                            <button onClick={handleAddExerciseSubmit} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg mt-2">
                                Add Exercise
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Exercise Modal */}
            {editingExercise && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full p-6 my-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Edit {editingExercise.name}</h3>
                            <button onClick={() => setEditingExercise(null)}><X size={24} /></button>
                        </div>

                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                            {editingExercise.sets.map((set, setIndex) => {
                                const percentage = parseFloat(set.percentage) / 100 || 0;
                                const weight = Math.round((editingExercise.oneRepMax * percentage) / 2.5) * 2.5;
                                return (
                                    <div key={setIndex} className="flex items-center gap-3 bg-gray-700/50 p-3 rounded-lg">
                                        <span className="text-blue-400 font-bold w-8 text-center">{setIndex + 1}</span>
                                        <div className="flex-1 grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-xs text-gray-400">Reps</label>
                                                <input
                                                    type="text"
                                                    value={set.reps}
                                                    onChange={(e) => handleSetChange(setIndex, 'reps', e.target.value)}
                                                    className="w-full bg-gray-700 text-white p-2 rounded text-center"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-400">%</label>
                                                <input
                                                    type="number"
                                                    value={set.percentage}
                                                    onChange={(e) => handleSetChange(setIndex, 'percentage', e.target.value)}
                                                    className="w-full bg-gray-700 text-white p-2 rounded text-center"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="text-green-400 text-sm font-bold w-20 text-right">
                                                {weight > 0 ? `${weight} lbs` : '-'}
                                            </div>
                                            {(editingExercise.isBarbell && weight > 45) && (
                                                <PlateVisualizer weight={weight} />
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleRemoveSet(setIndex)}
                                            disabled={editingExercise.sets.length <= 1}
                                            className="p-1 text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={handleAddSet}
                            className="w-full mt-3 py-2 border-2 border-dashed border-gray-600 text-gray-400 rounded-lg hover:border-gray-400 hover:text-white transition flex justify-center items-center gap-2"
                        >
                            <Plus size={18} /> Add Set
                        </button>

                        <button onClick={handleUpdateExercise} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg mt-4">
                            Update Exercise
                        </button>
                    </div>
                </div>
            )
            }

            {/* Save Template Modal */}
            {
                saveTemplateModalOpen && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold">Save as New Template</h3>
                                <button onClick={() => setSaveTemplateModalOpen(false)}><X size={24} /></button>
                            </div>
                            <div className="space-y-4">
                                <FormField label="Template Name" type="text" placeholder="My Custom Program" value={templateName} onChange={e => setTemplateName(e.target.value)} />
                                <FormField label="Description" type="textarea" placeholder="Describe your program..." value={templateDescription} onChange={e => setTemplateDescription(e.target.value)} />

                                <button
                                    onClick={confirmSaveTemplate}
                                    disabled={!templateName}
                                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg mt-2 disabled:opacity-50"
                                >
                                    Save Template
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showOneRepMaxPrompt && missingExerciseFor1RM && (
                    <OneRepMaxPrompt
                        missingExercises={[missingExerciseFor1RM.id]}
                        lifts={{ [missingExerciseFor1RM.id]: { name: missingExerciseFor1RM.name } }}
                        onSave={handle1RMSave}
                        onCancel={() => { setShowOneRepMaxPrompt(false); setMissingExerciseFor1RM(null); }}
                    />
                )
            }

            {
                confirmModal.open && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
                        <div className="bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6 animate-fade-in border border-gray-700">
                            <h3 className="text-xl font-bold mb-2 text-white">{confirmModal.title}</h3>
                            <p className="text-gray-300 mb-6">{confirmModal.message}</p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}
                                    className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmModal.onConfirm}
                                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg transition-transform active:scale-95"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

        </div >
    );
};
