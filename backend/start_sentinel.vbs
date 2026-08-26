Set objShell = CreateObject("WScript.Shell")
' Run the Python agent completely invisibly (0 means hide window)
' We specify the absolute path to pythonw.exe (windowless python) and main.py
objShell.CurrentDirectory = "C:\Users\sy099\Downloads\screen_sentinel\backend"
objShell.Run "pythonw.exe main.py", 0, False
