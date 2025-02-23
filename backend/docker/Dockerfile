FROM gcc:latest

WORKDIR /app
COPY main.cpp /app/main.cpp

# ✅ คอมไพล์ C++ และบันทึก Error
RUN g++ -o main main.cpp 2> compile_error.txt || true

# ✅ ถ้ามี Compile Error → แสดง Error, ถ้าไม่มี → รันโปรแกรม + Sleep
CMD ["sh", "-c", "if [ -s compile_error.txt ]; then cat compile_error.txt && exit 1; else ./main; sleep 0.1; fi"]
